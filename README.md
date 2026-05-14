# FoodBridge - Smart Food Redistribution System

FoodBridge is a modern full-stack web application designed to reduce food wastage by connecting donors (restaurants, individuals) with NGOs and volunteers in real-time.

## Features

- **Role-Based Dashboards**: Customized experiences for Donors, NGOs, Volunteers, and Admins.
- **Hunger Heatmap**: Real-time visualization of food demand priority zones using OpenStreetMap and Leaflet.
- **Smart Donation Flow**: Step-by-step food donation upload with image support and location picking.
- **Live Tracking**: Map-based tracking of food deliveries from donor to destination.
- **Analytics**: Comprehensive insights for admins to monitor impact and system health.
- **Dark/Light Mode**: Full support for system-wide theme switching.
- **Responsive Design**: Optimized for all devices using Tailwind CSS.

## Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend**: Firebase (Authentication, Firestore, Storage).
- **Maps**: OpenStreetMap, React Leaflet, Leaflet Heatmap.

## Getting Started

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Set up Firebase**:
   - Create a project on [Firebase Console](https://console.firebase.google.com/).
   - Enable Authentication (Email/Password & Google).
   - Create a Firestore Database.
   - Create a Storage bucket.
   - Copy your Firebase config into `src/services/firebase.js`.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## Firebase Configuration

Replace the placeholders in `src/services/firebase.js` with your actual credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Firestore Collections

The app expects the following collections:
- `users`: User profiles with roles.
- `donations`: Food donation records.
- `heatmapData`: Location-based hunger scores.
- `analytics`: Event logs for impact tracking.

## License

This project is licensed under the MIT License.

## Author

Developed with ❤️ for social impact and smarter food distribution.
