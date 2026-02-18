<div align="center">

# BANTAYOG ALERT

### Real-Time Hazard & Disaster Reporting System

**Province of Camarines Norte, Philippines**

[![CI](https://github.com/your-org/bantayog-alert/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/bantayog-alert/actions/workflows/ci.yml)
[![Deploy](https://github.com/your-org/bantayog-alert/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/bantayog-alert/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

**Bantayog Alert** is a progressive web application (PWA) that enables residents and local government units of the Province of Camarines Norte to report, track, and respond to hazards and disasters in real time. Citizens submit geolocated reports with photo/video evidence, which are verified by administrators and displayed on an interactive map for community-wide situational awareness.

> _"Bantayog"_ — Filipino for sentinel or watchpost.

## Key Features

- **Interactive Hazard Map** — Live Leaflet map with clustered disaster markers, municipality boundaries, and geolocation
- **Citizen Reporting** — Submit hazard reports with geolocation, photo/video evidence, and disaster classification (flood, landslide, fire, typhoon, earthquake, and more)
- **Real-Time Feed** — Chronological feed of verified reports with upvote engagement and filtering
- **Weather Dashboard** — Live weather data and alerts for Camarines Norte municipalities via OpenWeather API
- **Admin Verification** — Admin panel for report verification, resolution tracking, and evidence review
- **Authentication** — Firebase Auth with anonymous reporting and optional account creation
- **Geofencing** — Automatic municipality detection using Turf.js point-in-polygon analysis
- **Input Sanitization** — DOMPurify-based XSS protection and content validation
- **Rate Limiting** — Client-side rate limiting to prevent report spam
- **Error Monitoring** — Sentry integration for production error tracking and performance monitoring
- **PWA Support** — Installable progressive web app with service worker and offline capability
- **Responsive Design** — Mobile-first UI built with Tailwind CSS

## Tech Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Framework        | React 18 + Vite 5                              |
| Styling          | Tailwind CSS 3                                 |
| Backend / BaaS   | Firebase (Firestore, Auth, Storage, Hosting)   |
| Maps             | Leaflet + React-Leaflet + MarkerCluster        |
| Geospatial       | Turf.js (point-in-polygon, centroid, distance) |
| Weather          | OpenWeather API                                |
| Error Tracking   | Sentry                                         |
| Testing          | Vitest + React Testing Library                 |
| Linting          | ESLint 9 (flat config) + Prettier              |
| CI/CD            | GitHub Actions                                 |
| Containerization | Docker + Nginx                                 |

## Prerequisites

- **Node.js** >= 18.x (20.x recommended)
- **npm** >= 9.x
- **Firebase account** with a project configured (Firestore, Auth, Storage, Hosting)
- **OpenWeather API key** ([get one here](https://openweathermap.org/api))
- **Docker** (optional, for containerized development/deployment)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/bantayog-alert.git
cd bantayog-alert

# Install dependencies
npm ci

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase and OpenWeather credentials

# Start the development server
npm run dev
```

The app will open at **http://localhost:3000**.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenWeather API
VITE_OPENWEATHER_API_KEY=your_openweather_key

# Sentry (optional — leave empty to disable)
VITE_SENTRY_DSN=
```

See [`.env.example`](.env.example) for full documentation of all environment variables.

## Available Scripts

| Command                    | Description                             |
| -------------------------- | --------------------------------------- |
| `npm run dev`              | Start Vite dev server (port 3000)       |
| `npm run build`            | Production build to `dist/`             |
| `npm run build:dev`        | Development build                       |
| `npm run preview`          | Preview production build locally        |
| `npm run lint`             | Run ESLint with zero-warning policy     |
| `npm run lint:fix`         | Auto-fix ESLint issues                  |
| `npm run format`           | Format code with Prettier               |
| `npm run format:check`     | Check formatting without writing        |
| `npm test`                 | Run Vitest in watch mode                |
| `npm run test:run`         | Run tests once                          |
| `npm run test:coverage`    | Run tests with V8 coverage report       |
| `npm run check:boundaries` | Evaluate municipality boundary accuracy |

## Project Structure

```
bantayog-alert/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # CI pipeline (lint, test, build)
│   │   ├── deploy.yml             # Firebase Hosting deployment
│   │   └── firebase-preview.yml   # PR preview deployments
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── dist/                          # Production build output
├── nginx/                         # Nginx config for Docker deployment
├── scripts/
│   └── evaluateMunicipalityBoundaries.mjs
├── src/
│   ├── components/
│   │   ├── Admin/                 # Admin dashboard, verification, resolution
│   │   ├── Common/                # Shared UI (Button, Modal, Toast, ErrorBoundary, etc.)
│   │   ├── Feed/                  # Report feed, filters, engagement
│   │   ├── Layout/                # Header, Footer, TabNavigation
│   │   ├── Map/                   # Leaflet map, markers, clusters, controls
│   │   ├── Reports/               # Report form, modal, evidence capture
│   │   └── Weather/               # Weather cards, grid, alerts
│   ├── config/                    # App config and Sentry setup
│   ├── contexts/                  # React contexts (Auth, Reports)
│   ├── data/                      # Disaster types and static data
│   ├── hooks/                     # Custom hooks (auth, geolocation, reports, weather, etc.)
│   ├── pages/                     # Tab pages (Map, Feed, Weather, Profile)
│   ├── test/                      # Test utilities and fixtures
│   └── utils/                     # Firebase config, geofencing, sanitization, rate limiting
├── .env.example                   # Environment variable template
├── Dockerfile                     # Production Docker image (multi-stage)
├── Dockerfile.dev                 # Development Docker image
├── firebase.json                  # Firebase Hosting + Firestore + Storage config
├── firestore.rules                # Firestore security rules
├── storage.rules                  # Firebase Storage security rules
├── tailwind.config.js             # Tailwind CSS configuration
├── vite.config.js                 # Vite + Vitest + Sentry plugin config
└── eslint.config.js               # ESLint flat config
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                    │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐ │
│  │  MapTab   │  │ FeedTab  │  │Weather  │  │Profile  │ │
│  │ (Leaflet) │  │ (Feed)   │  │  Tab    │  │  Tab    │ │
│  └─────┬─────┘  └────┬─────┘  └────┬────┘  └────┬────┘ │
│        │              │             │             │      │
│  ┌─────┴──────────────┴─────────────┴─────────────┴───┐ │
│  │              Context Providers                      │ │
│  │         (AuthContext, ReportsContext)                │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────┴───────────────────────────────┐ │
│  │              Custom Hooks Layer                      │ │
│  │  useAuth · useReports · useGeolocation · useWeather │ │
│  └─────────────────────┬───────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────┴────┐    ┌─────┴─────┐   ┌─────┴─────┐
    │Firebase │    │OpenWeather│   │  Sentry   │
    │Firestore│    │   API     │   │  (errors) │
    │Auth     │    └───────────┘   └───────────┘
    │Storage  │
    └─────────┘
```

**Data Flow:**

1. Citizens submit hazard reports via the **ReportModal** with geolocation and optional photo evidence
2. Reports are stored in **Firebase Firestore** with images uploaded to **Firebase Storage**
3. **Turf.js geofencing** automatically detects the municipality from GPS coordinates
4. Administrators verify reports through the **Admin Dashboard**
5. Verified reports appear on the **interactive map** (clustered markers) and the **real-time feed**
6. **Weather data** is fetched from OpenWeather API for Camarines Norte municipalities

## Deployment

### Firebase Hosting (Recommended)

The project includes automated deployment via GitHub Actions on push to `main`:

```bash
# Manual deployment
npm run build
npx firebase deploy --only hosting
```

### Docker

**Production:**

```bash
docker build -t bantayog-alert .
docker run -p 80:80 bantayog-alert
```

**Development:**

```bash
docker build -f Dockerfile.dev -t bantayog-alert-dev .
docker run -p 5173:5173 -v $(pwd):/app bantayog-alert-dev
```

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a pull request.

## Security

To report security vulnerabilities, please see our [Security Policy](SECURITY.md).

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- **Province of Camarines Norte** — target deployment region
- [Firebase](https://firebase.google.com/) — backend-as-a-service platform
- [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) — interactive mapping
- [Turf.js](https://turfjs.org/) — geospatial analysis
- [OpenWeather](https://openweathermap.org/) — weather data API
- [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS framework
- [Vite](https://vitejs.dev/) — next-generation frontend tooling
- [Sentry](https://sentry.io/) — error monitoring and performance tracking
