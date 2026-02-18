# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-18

### Added

- Interactive hazard map with Leaflet, marker clustering, and municipality boundaries
- Citizen hazard reporting with geolocation, photo/video evidence, and disaster classification
- Support for 12 disaster types: flood, landslide, fire, earthquake, typhoon, health, road incident, infrastructure, environmental, security, other, and unclassified
- Real-time report feed with infinite scroll, upvote engagement, and filtering
- Weather dashboard with live data and alerts for Camarines Norte municipalities via OpenWeather API
- Firebase Authentication with anonymous reporting and optional account creation
- Admin dashboard for report verification, resolution tracking, and evidence review
- Automatic municipality detection via Turf.js geofencing (point-in-polygon)
- Input sanitization with DOMPurify for XSS protection
- Client-side rate limiting to prevent report spam
- Image compression for uploaded evidence (browser-image-compression)
- Sentry integration for error tracking and performance monitoring
- Progressive Web App (PWA) support with service worker and installability
- Responsive mobile-first UI with Tailwind CSS
- CI pipeline with GitHub Actions (lint, format, test, build on Node 18/20)
- Automated Firebase Hosting deployment on push to main
- PR preview deployments via Firebase Hosting
- Docker support with multi-stage production build (Nginx) and development container
- Firestore and Storage security rules
- Comprehensive test setup with Vitest and React Testing Library
- ESLint 9 flat config with Prettier integration
- Dependabot configuration for automated dependency updates

[1.0.0]: https://github.com/your-org/bantayog-alert/releases/tag/v1.0.0
