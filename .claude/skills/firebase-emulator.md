# Skill: Firebase Emulator

## Purpose

Start Firebase emulators for local development and testing of Firestore rules and Storage rules.

## Steps

### Start Emulators

1. **Start all configured emulators**
   ```bash
   npx firebase emulators:start
   ```

2. **Start specific emulators**
   ```bash
   npx firebase emulators:start --only firestore,storage,auth
   ```

3. **Emulator UI** is available at `http://localhost:4000` (default).

### Test Rules Against Emulator

4. **Run tests with emulator**
   ```bash
   npx firebase emulators:exec --only firestore "npm run test:run"
   ```
   This starts the emulator, runs tests, then shuts down the emulator.

### Stop Emulators

5. Emulators started with `emulators:start` run in the foreground. Press `Ctrl+C` to stop.
   Emulators started with `emulators:exec` stop automatically after the command completes.

## Use Cases

- **Developing Firestore rules**: Edit `firestore.rules`, test against emulator before deploying
- **Developing Storage rules**: Edit `storage.rules`, test uploads/downloads locally
- **Testing auth flows**: Use Auth emulator to avoid hitting production auth

## Success Criteria

- Emulators start without port conflicts
- Emulator UI accessible at `http://localhost:4000`
- Rules tests pass against emulated Firestore

## Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Port already in use | Previous emulator still running | Kill the process on the port or use different ports |
| Java not found | Firebase emulators require Java | Install Java JDK (11+) |
| Rules test fails | Rule logic doesn't match test expectations | Check rule conditions in `firestore.rules` |

## Related

- `workflows/error-handling.md` — emulator testing for rule changes
- `.claude/skills/deploy-firebase.md` — deploy rules after testing
- `errors/firebase-permission-denied.md` — permission errors often found via emulator
