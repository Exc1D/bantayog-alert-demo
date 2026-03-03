import { spawn, execSync } from 'child_process';
import http from 'http';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;
const MAX_RETRIES = 60; // Wait up to 60 seconds
const RETRY_INTERVAL = 1000;

function log(message) {
  console.log(`[Performance Test] ${message}`);
}

function runCommand(command) {
  log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    log(`Error running command: ${command}`);
    process.exit(1);
  }
}

function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.get(URL, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve();
      } else {
        reject(new Error(`Status code: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function waitForServer() {
  log('Waiting for server...');
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      await checkServer();
      log('Server is up!');
      return;
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        log(`Server failed to start in time. Last error: ${error.message}`);
        throw error;
      }
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
    }
  }
}

async function main() {
  let server;
  try {
    // 1. Build
    log('Building project...');
    runCommand('npm run build');

    // 2. Start Server
    log('Starting server...');
    // Using shell: true ensures npx is found in PATH
    server = spawn('npx', ['serve', 'dist', '-l', PORT, '-c', '../serve.json'], {
      stdio: 'ignore',
      shell: true,
      detached: true,
    });

    // 3. Wait for Server
    await waitForServer();

    // 4. Run Lighthouse
    log('Running Lighthouse...');
    const lighthouseCmd = `npx lighthouse ${URL} --chrome-flags="--headless" --output html --output json --output-path ./lighthouse-report`;
    execSync(lighthouseCmd, { stdio: 'inherit' });

    log('Lighthouse reports generated: ./lighthouse-report.html, ./lighthouse-report.json');
  } catch (error) {
    log(`Test failed: ${error.message}`);
    process.exit(1);
  } finally {
    // 5. Cleanup
    log('Stopping server...');
    if (server) {
      try {
        // Kill the process group to ensure children are killed
        process.kill(-server.pid);
      } catch (e) {
        try {
          server.kill();
        } catch (e2) {
          // ignore
        }
      }
    }

    // Force cleanup just in case
    try {
      execSync(`pkill -f 'serve dist'`, { stdio: 'ignore' });
    } catch (e) {
      // ignore
    }
  }
}

main();
