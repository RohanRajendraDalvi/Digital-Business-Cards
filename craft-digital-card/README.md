# Craft Digital Cards

A web application for creating interactive 3D digital business cards. Built with React and Three.js, it enables professionals to share their contact information through a memorable, customizable experience.

**Live Demo**: [craftdigitalcards.vercel.app](https://craftdigitalcards.vercel.app)

## Features

### Interactive 3D Cards
- Three.js-powered 3D business cards with real-time rendering
- Intuitive controls: drag to rotate, click to flip, scroll to zoom
- Responsive layouts adapting between portrait and landscape orientations
- Ambient particle effects and dynamic lighting

### Customization Options
- 14 theme variants (7 dark, 7 light)
- 8 background patterns including grid, waves, circuit, and honeycomb
- 5 material presets: default, glossy, matte, metallic, and holographic
- Custom logo uploads with automatic processing

### AI-Powered Import
- Import professional data from resume text or PDF uploads
- LinkedIn profile text parsing
- Intelligent field extraction using Llama AI
- Non-destructive import preserving existing card data

### Sharing and Export
- Unique shareable URLs (domain.com/username)
- Auto-generated QR codes for card sharing and website links
- vCard export for contact saving
- Print-ready card generation
- Native mobile share integration

### Authentication
- Google OAuth integration
- Email and password authentication
- Password strength validation
- Username reservation system

## Technology Stack

| Category | Technologies |
|----------|-------------|
| Frontend | React 18, React Router v7 |
| 3D Graphics | Three.js r128 |
| Authentication | Firebase Auth |
| Database | Cloud Firestore |
| AI Processing | Llama API |
| Hosting | Vercel |
| Analytics | Vercel Analytics, Speed Insights |

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase project
- Vercel account (for deployment)

### Installation

1. Clone the repository
```bash
   git clone https://github.com/RohanRajendraDalvi/Digital-Business-Cards.git
   cd Digital-Business-Cards
```

2. Install dependencies
```bash
   npm install
```

3. Configure environment variables

   Create a `.env` file in the root directory:
```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # AI Import API (optional)
   VITE_AI_API_URL=your_ai_api_endpoint
   VITE_AI_API_KEY=your_ai_api_key
```

4. Set up Firebase
   - Create a project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication with Google and Email/Password providers
   - Create a Firestore database
   - Register your web app to obtain configuration values

5. Start the development server
```bash
   npm run dev
```

6. Open `http://localhost:5173` in your browser

## Project Structure
```
src/
├── assets/                 # Static assets
├── components/
│   ├── auth/               # Authentication components
│   │   ├── AuthModal.jsx
│   │   └── UsernameSetup.jsx
│   ├── card/               # Business card rendering
│   │   └── BusinessCard.jsx
│   └── shared/             # Shared UI components
│       └── Navbar.jsx
├── config/
│   ├── darkTheme.js        # Dark theme definitions
│   ├── lightTheme.js       # Light theme definitions
│   ├── materials.js        # Patterns and materials
│   ├── defaultCard.js      # Default configuration
│   └── demoCard.js         # Demo data
├── context/
│   └── AuthContext.jsx     # Authentication state management
├── hooks/
│   ├── useUserCard.js      # Card CRUD operations
│   ├── usePublicCard.js    # Public card fetching
│   ├── useAIImport.js      # AI import logic
│   └── useLogoUpload.js    # Logo processing
├── pages/
│   ├── LandingPage.jsx     # Marketing page
│   ├── EditorPage.jsx      # Card editor
│   └── PublicCardPage.jsx  # Public card display
├── utils/
│   └── security.js         # Validation utilities
├── App.jsx
├── main.jsx
└── index.css
```

## Configuration

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /cards/{username} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.username == username;
    }
    
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

### Content Limits

| Field Type | Character Limit |
|------------|-----------------|
| Short text (name, title) | 100 |
| Medium text (tagline) | 200 |
| Long text (URLs) | 500 |
| Section items | 8 per section |
| Skills per set | 12 |
| Social links | 6 |
| Logo file size | 512 KB |

## Deployment

### Vercel

1. Import the repository at [vercel.com](https://vercel.com)
2. Add environment variables in project settings
3. Deploy (automatic on push to main branch)
4. Enable Analytics in the project dashboard (optional)

### Manual Build
```bash
npm run build
```

Production files are output to the `dist` directory.

## Analytics

The application includes Vercel Analytics and Speed Insights for performance monitoring:
```jsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Acknowledgments

- [Three.js](https://threejs.org/) - 3D rendering library
- [Firebase](https://firebase.google.com/) - Authentication and database services
- [Vercel](https://vercel.com/) - Hosting platform
- [QR Server API](https://goqr.me/api/) - QR code generation

## Contact

Rohan Dalvi - dalvi.ro@northeastern.edu

Project Link: [https://github.com/RohanRajendraDalvi/Digital-Business-Cards](https://github.com/RohanRajendraDalvi/Digital-Business-Cards)