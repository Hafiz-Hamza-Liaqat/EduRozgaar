# Strideto Mobile (Phase-8)

React Native (Expo) app for Strideto – uses `/api/v1` for Jobs, Scholarships, Admissions, Trending, Bookmarks, Notifications.

## Setup

1. Install dependencies: `npm install`
2. Set API URL: `EXPO_PUBLIC_API_URL=http://YOUR_API_URL/api/v1` (e.g. `http://localhost:5000/api/v1` for dev)
3. Add assets: `assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` (or use Expo default)

## Run

- `npm start` – Expo dev server
- `npm run android` / `npm run ios` – device/simulator

## Features

- Home (trending jobs), Jobs, Scholarships, Admissions, Saved (bookmarks), Profile
- Dark/Light mode toggle (Profile)
- Multi-language placeholder (EN/UR) in Profile
- Push notifications: integrate Firebase Cloud Messaging and pass token to backend

## Auth

Saved/Bookmarks and Recommendations require JWT. Call `setAuthToken(token)` from `api/client.js` after login (add Login screen and auth flow as needed).
