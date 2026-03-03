# Error: Firebase Permission Denied

## Error Message

```
FirebaseError: Missing or insufficient permissions.
```

or in the browser console:

```
@firebase/firestore: Firestore (10.x.x): ...
PERMISSION_DENIED: Missing or insufficient permissions.
```

## When It Occurs

- Submitting a hazard report
- Reading the report feed
- Accessing the admin dashboard
- Updating a user profile
- Any Firestore read or write operation that fails a security rule check

## Root Cause

The Firestore security rules in `firestore.rules` rejected the request. Common causes:

1. **User is not authenticated** — Anonymous auth not initialized before the write
2. **Role insufficient** — Action requires `moderator` or `admin` role but user has `user`
3. **Rules not deployed** — Local rule changes weren't deployed (`firebase deploy --only firestore:rules`)
4. **Field validation failed** — Document doesn't pass the security rule validators (bad description length, invalid disaster type, out-of-bounds coordinates)
5. **Owner mismatch** — Write to another user's document path (e.g., avatar upload to wrong UID path)

## Solution

### 1. Check authentication state

Open browser DevTools → Console, verify `firebase.auth().currentUser` is not null before the operation.

If using anonymous auth, confirm it is enabled in the Firebase Console (Authentication → Sign-in method → Anonymous → Enable).

### 2. Check the rule in Firebase Console

Firebase Console → Firestore → Rules → Rules Playground

Simulate the request with the same auth state and document data. The playground shows which rule rejected it.

### 3. Check with the emulator

```bash
firebase emulators:start
```

The emulator shows detailed rule evaluation logs in the terminal, including which `allow` clause failed.

### 4. Deploy updated rules

If you've edited `firestore.rules` locally but not deployed:

```bash
firebase deploy --only firestore:rules
```

### 5. Validate input data

If the rule has field validators, ensure the document being written meets all constraints:
- Description: 10–2000 characters
- Disaster type: valid enum value
- Location: lat 12.5–15.5, lng 122.0–124.0
- No XSS patterns in string fields

## Prevention

- Test rule changes with Firebase Emulator before deploying
- Add test cases in `src/test/` for permission scenarios
- Use the Rules Playground after any rule deployment to confirm expected behavior

## Related Files

- `firestore.rules`
- `storage.rules`
- `docs/security-rules.md` (permission matrix)
- `src/utils/firebase.js` (Firebase initialization)
- `src/contexts/AuthContext.jsx` (auth state)
