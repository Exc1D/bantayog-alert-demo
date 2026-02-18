# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in Bantayog Alert, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email **[INSERT SECURITY EMAIL]** with:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

2. You will receive an acknowledgment within **48 hours**.

3. We will investigate and provide a timeline for a fix within **5 business days**.

4. Once the fix is released, we will publicly disclose the vulnerability with credit to the reporter (unless anonymity is requested).

### Scope

The following are in scope:

- The Bantayog Alert web application
- Firebase security rules (Firestore, Storage)
- Authentication and authorization logic
- Input sanitization and XSS prevention
- API key exposure or leakage
- Client-side data handling

### Out of Scope

- Vulnerabilities in third-party dependencies (report these to the upstream project)
- Social engineering attacks
- Denial of service attacks
- Issues in development/staging environments that do not affect production

## Security Measures

This project implements the following security practices:

- **Input sanitization** — All user-generated content is sanitized with DOMPurify before rendering
- **Content validation** — Input is validated using the `validator` library
- **Firebase Security Rules** — Firestore and Storage access is restricted via declarative security rules
- **Authentication** — Firebase Auth handles user identity; anonymous sessions are supported
- **Rate limiting** — Client-side rate limiting prevents abuse of the reporting system
- **Error monitoring** — Sentry captures runtime errors without exposing sensitive data
- **Dependency scanning** — Dependabot monitors for known vulnerabilities in dependencies
- **Environment variables** — All secrets are stored in environment variables, never committed to the repository
- **Media safety** — Uploaded images are compressed and validated before storage

## Acknowledgments

We appreciate the security research community's efforts in helping keep Bantayog Alert safe for the communities it serves.
