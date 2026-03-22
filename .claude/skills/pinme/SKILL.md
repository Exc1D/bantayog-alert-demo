---
name: pinme
description: Use when someone wants to upload files to IPFS, share via decentralized storage, deploy to IPFS, or mentions "pinme", "pin", "IPFS", or "upload to IPFS".
allowed-tools: Bash
---

# PinMe Skill

Use PinMe CLI to upload files and get a preview URL.

## When to Use

- User wants to upload any files or folders to IPFS
- User wants to share files via decentralized storage
- User mentions "pinme", "pin", "IPFS", or "upload to IPFS"
- User requests deployment of a frontend project to IPFS

## When NOT to Use

- For sensitive files that should not be on public IPFS (credentials, keys, personal data)
- Without checking that the content is hash-mode compatible if deploying a SPA
- As a replacement for Firebase Hosting or other managed hosting solutions

## Upload Steps

### 1. Check if PinMe is Installed

```bash
pinme --version
```

If not installed:
```bash
npm install -g pinme
```

### 2. Identify Upload Target

**For general files:** Use the file or directory path specified by the user.

**For website deployment:** Look for build output directories (in priority order):
1. `dist/` - Vue/React/Vite default output
2. `build/` - Create React App output
3. `out/` - Next.js static export
4. `public/` - Pure static projects

### 3. Execute Upload

```bash
pinme upload <path>
```

Examples:
```bash
# Upload a single file
pinme upload ./document.pdf

# Upload a folder
pinme upload ./my-folder

# Upload website build output
pinme upload dist
```

### 4. Return Result

After successful upload, return the preview URL:
```
https://pinme.eth.limo/#/preview/<hash>
```

## Router Mode Check

Before building a frontend project for IPFS deployment, ensure it uses **hash mode** routing (e.g., `/#/about`). History mode (e.g., `/about`) will cause **404 errors** on sub-routes when deployed to IPFS.

- **React**: Use `HashRouter` instead of `BrowserRouter`
- **Vue**: Use `createWebHashHistory()` instead of `createWebHistory()`

## Important Rules

**DO:**
- Verify the file or directory exists before uploading
- Return the preview URL to the user

**DO NOT:**
- Upload `node_modules/`
- Upload `.env` files
- Upload `.git/` directory
- Upload empty or non-existent paths

## Common Workflows

### General File Upload
```bash
pinme upload ./image.png
pinme upload ./my-documents
pinme upload /path/to/files
```

### Website Deployment
```bash
npm run build && pinme upload dist
```

## Error Handling

| Error | Solution |
|-------|----------|
| `command not found: pinme` | Run `npm install -g pinme` |
| `No such file or directory` | Check path exists |
| `Permission denied` | Check file/folder permissions |
| Upload failed | Check network, retry |

## Other Commands

```bash
# List upload history
pinme list
pinme ls -l 5

# Remove uploaded file
pinme rm <hash>
```
