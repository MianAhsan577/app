# Spirit Furniture Backend

This is a Node.js + Express backend that can use either Firebase Firestore or an in-memory store for logging user interactions from the Spirit Furniture website.

## Features

- Express server with API endpoints
- Two-layer interactive interface (City selection → Furniture type selection)
- Support number mapping for each city-service combination
- Flexible data storage: Firebase Firestore or in-memory store
- Environment-based configuration
- Admin dashboard with logs and statistics

## Prerequisites

- Node.js 14+ installed
- (Optional) Firebase project with Firestore enabled

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd spirit-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Firebase configuration (optional):
```bash
npm run setup
```
This interactive script will guide you through the Firebase configuration setup.

## Storage Options

### In-Memory Storage (Default)

The application uses in-memory storage by default, which is perfect for:
- Local development and testing
- Quick deployments without external dependencies
- Scenarios where data persistence between restarts is not required

The app now starts without any demo logs by default. Real user interactions will be logged automatically as they occur.

### Firebase Firestore Storage

For production or when persistent storage is needed, the application can use Firebase Firestore:
1. Run the setup script: `npm run setup`
2. Enter your Firebase project details when prompted
3. The application will automatically detect and use Firebase when configured

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## API Endpoints

- `GET /admin/logs`: Get logs with pagination and filtering
- `GET /admin/stats`: Get statistics about user interactions
- `POST /admin/reset-logs`: Reset logs with sample data (for testing only)
- `GET /api/admin/logs/sse`: Server-Sent Events endpoint for real-time logs
- `GET /api/health`: Health check endpoint
- `POST /api/log-selection`: Log user selection from the website

## Working with Logs

### Real-time Logs

The application captures real user interactions in real-time as they use the selection interface. These logs are stored in memory by default (or in Firebase if configured) and can be viewed in the admin dashboard.

### Demo Logs

For testing or demonstration purposes, you can add sample logs through the admin interface:

1. Go to the admin dashboard at `/admin.html`
2. Log in with the default credentials
3. Click the "Reset Sample Logs" button in the filters panel to create demo logs

This is useful for testing the interface without having to generate actual user interactions.

## Firebase Setup

If you choose to use Firebase Firestore for storage:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore in your project
3. Get your Firebase web configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Find or create a web app
   - Copy the configuration values

4. Run the setup script and enter the configuration values:
```bash
npm run setup
```

5. The script will create/update your `.env` file with the Firebase configuration

## Firebase Security Rules

For secure access to your Firestore database, use these security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /logs/{document} {
      allow read, write: if request.auth != null;
    }
    match /user_interactions/{document} {
      allow read, write: if request.auth != null;
    }
    match /admin_users/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Project Structure

```
spirit-backend/
│
├── src/
│   ├── config/            # Configuration files
│   │
│   ├── controllers/       # Request handlers
│   │   ├── admin.controller.js     # Admin dashboard controller
│   │   ├── auth.controller.js      # Authentication controller
│   │   └── selection.controller.js # Selection handling controller
│   │
│   ├── routes/            # API routes
│   │   ├── admin.routes.js     # Admin dashboard routes
│   │   ├── auth.routes.js      # Authentication routes
│   │   ├── index.js            # Routes index
│   │   └── selection.routes.js # Selection routes
│   │
│   ├── utils/             # Utility functions
│   │   └── memoryStore.js     # Flexible storage implementation
│   │
│   ├── app.js             # Express application setup
│   └── index.js           # Application entry point
│
├── public/                # Static files (admin dashboard)
│   ├── css/               # CSS files
│   ├── js/                # JavaScript files
│   ├── admin.html         # Admin dashboard HTML
│   └── index.html         # Main page HTML
│
├── .env                   # Environment variables (not tracked in git)
├── setup-firebase.js      # Firebase configuration setup script
├── package.json           # Project metadata and dependencies
└── README.md              # Project documentation
```

## Admin Dashboard

The application includes an admin dashboard accessible at `/admin.html` which provides:
- Log viewing with filtering and pagination
- Statistics about user interactions
- Real-time log updates via Server-Sent Events
- Authentication with JWT

Default login credentials:
- Email: admin@example.com
- Password: password123

## License

ISC 