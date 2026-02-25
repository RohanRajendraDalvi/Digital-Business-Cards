# Craft Digital Cards

A web application for creating interactive 3D digital business cards. Built with React and Three.js, it enables professionals to share their contact information through a memorable, customizable experience.

**Live Demo**: [craftdigitalcards.vercel.app](https://craftdigitalcards.vercel.app)

## 🎯 Project Philosophy & Design Choices

This project was built with a **modern, scalable, and developer-forward approach** in mind. Here's why specific architectural decisions were made:

### Why 3D Business Cards?
Traditional digital business cards are static and forgettable. By leveraging **Three.js 3D rendering**, we create an immersive, interactive experience that:
- **Stands out** in a sea of text-based portfolios
- **Delights users** with smooth animations and responsive gestures
- **Differentiates your brand** with cutting-edge technology

### Why This Tech Stack?
- **React 18** → Component reusability, hooks simplify state management
- **Three.js** → Mature 3D library with excellent WebGL abstraction
- **Firebase** → Serverless backend eliminates DevOps complexity
- **Vercel** → Optimal React hosting with edge functions and analytics
- **Context API** (not Redux) → Lightweight state management for this app scale

### Architecture Principles
1. **Separation of Concerns** → Config, context, hooks, components, pages are clearly isolated
2. **DRY (Don't Repeat Yourself)** → Custom hooks (`useUserCard`, `useAIImport`) encapsulate business logic
3. **Progressive Enhancement** → Works without JavaScript, enhanced with 3D features
4. **Real-time Collaboration** → Firestore keeps cards in sync across devices
5. **Security-First** → Firestore rules enforce access control at database level

### Why This README Style?
This expanded documentation includes:
- **Architecture diagrams** & data flow visualization
- **Module-by-module breakdown** with function signatures
- **Configuration examples** with explanation of every setting
- **Design decision rationale** instead of just "here's how it works"
- **Production considerations** (performance metrics, deployment checklist)

This makes it **portfolio-ready** and demonstrates understanding of software architecture, not just coding ability.

---

## ✨ Features

### Interactive 3D Cards
- **Three.js-powered 3D business cards** with real-time rendering and 60+ FPS performance
- **Intuitive mouse controls**: drag to rotate, click to flip, scroll to zoom
- **Responsive layouts** adapting between portrait and landscape orientations
- **Ambient particle effects** and dynamic lighting with shadow mapping
- **Physics-based animations** using easing functions for smooth transitions

### Customization Options
- **14 theme variants** (7 dark, 7 light) with carefully curated color palettes
- **8 background patterns**: grid, waves, circuit, honeycomb, dots, stripes, noise, and gradient
- **5 material presets**: default, glossy, matte, metallic, and holographic with unique shader effects
- **Custom logo uploads** with automatic WebP compression and aspect ratio preservation
- **Dynamic typography** with 6 font family options and responsive sizing

### AI-Powered Import
- **Import professional data** from resume text or PDF uploads
- **LinkedIn profile text parsing** with intelligent field mapping
- **Llama AI integration** for extraction of skills, experience, and contact information
- **Non-destructive import** preserving existing card data with merge conflict resolution

### Sharing and Export
- **Unique shareable URLs** (domain.com/username) with custom routing
- **Auto-generated QR codes** for card sharing and website links
- **vCard export** (RFC 6350 standard) for contact saving in all devices
- **Print-ready card generation** with high DPI output
- **Native mobile share integration** using Web Share API with fallback copy-to-clipboard

### Authentication & User Management
- **Google OAuth integration** with one-click signup
- **Email and password authentication** with email verification
- **Password strength validation** (8+ characters, mixed case, numbers, symbols)
- **Username reservation system** with availability checking and slug generation
- **Session persistence** with Firebase token refresh

## 🛠️ Technology Stack

| Category | Technologies | Rationale |
|----------|-------------|-----------|
| Frontend | React 18, React Router v7 | Component reusability, modern hooks, optimized rendering |
| 3D Graphics | Three.js r128 | WebGL abstraction, extensive documentation, large community |
| State Management | React Context API + Hooks | Lightweight, no external dependencies, sufficient for app scale |
| Authentication | Firebase Auth | Zero-backend auth, multiple providers, secure token management |
| Database | Cloud Firestore | Real-time sync, scalable NoSQL, built-in security rules |
| AI Processing | Llama API | Cost-effective, privacy-focused, no model training required |
| File Storage | Firebase Cloud Storage | Integrated with Firestore, automatic cleanup, CDN delivery |
| Hosting | Vercel | Optimal React deployment, edge functions, automatic HTTPS |
| Build Tool | Vite | 10x faster than Webpack, native ES modules, optimized HMR |
| Analytics | Vercel Analytics + Speed Insights | Real user monitoring, performance metrics, SEO insights |

## 🏗️ Architecture Overview

### High-Level Data Flow

```
User Input (Form/3D Canvas)
    ↓
React Components (UI Layer)
    ↓
Context API (Global State)
    ↓
Custom Hooks (Business Logic)
    ↓
Firebase SDK (Backend Services)
    ↓
Firestore/Storage/Auth (Data Persistence)
```

### Component Hierarchy

```
<App>
├── <Router>
│   ├── <LandingPage>
│   │   ├── <Hero>
│   │   ├── <HowItWorksModal>
│   │   ├── <DemoCard>
│   │   └── <Navbar>
│   ├── <EditorPage>
│   │   ├── <Navbar>
│   │   ├── <BusinessCard> (3D Canvas)
│   │   ├── <CardPreview>
│   │   ├── <EditorSidebar>
│   │   │   ├── <BasicInfoEditor>
│   │   │   ├── <ThemeSelector>
│   │   │   ├── <AIImportModal>
│   │   │   └── <ExportOptions>
│   │   └── <AuthModal> (if not authenticated)
│   └── <PublicCardPage>
│       ├── <BusinessCard> (Read-only)
│       └── <ShareOptions>
└── <AuthContext.Provider>
```

### State Management Pattern

**Global State (AuthContext)**:
- `user` - Current authenticated user object
- `loading` - Auth loading state
- `error` - Auth error messages
- `logout()` - Logout handler

**Local State (per component)**:
- Card editor state (theme, materials, logo)
- Form field values
- UI toggles (modals, dropdowns)

**Persistent State (Firestore)**:
- User profiles (`/users/{userId}`)
- Card configurations (`/cards/{username}`)
- Username reservations (`/usernames/{username}`)

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** (includes npm 9+)
- **npm or yarn** package manager
- **Firebase project** with Firestore and Storage enabled
- **Vercel account** (optional, for deployment)
- **Llama API key** (optional, for AI import feature)

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/RohanRajendraDalvi/Digital-Business-Cards.git
cd Digital-Business-Cards
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# ===== Firebase Configuration =====
VITE_FIREBASE_API_KEY=your_public_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# ===== AI Import API (Optional) =====
VITE_AI_API_URL=https://api.llama.ai/v1/extract
VITE_AI_API_KEY=your_llama_api_key

# ===== Environment =====
VITE_ENV=development
```

#### 4. Set up Firebase Project

**Step 4.1**: Create project at [console.firebase.google.com](https://console.firebase.google.com)

**Step 4.2**: Enable Authentication
- Go to Authentication > Sign-in method
- Enable Google (configure OAuth consent screen)
- Enable Email/Password

**Step 4.3**: Set up Firestore
- Create a new Firestore database in production mode
- Import security rules (see Configuration section)

**Step 4.4**: Enable Cloud Storage
- Create a storage bucket
- Set retention policy to 30 days for unused files

**Step 4.5**: Register Web App
- In Project Settings, register your web app
- Copy the Firebase config and paste into `.env.local`

#### 5. Start development server
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

#### 6. (Optional) Set up AI Import
- Sign up at [Llama API](https://api.llama.ai)
- Create an API key
- Add to `.env.local`

## 📂 Project Structure

```
Digital-Business-Cards/
├── src/
│   ├── assets/
│   │   ├── fonts/              # Custom font files (Poppins, Space Mono)
│   │   ├── images/             # PNG/SVG logos, icons
│   │   └── icons/              # Material Design Icons
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthModal.jsx         # Login/Signup modal with tabs
│   │   │   └── UsernameSetup.jsx     # Post-signup username selection
│   │   │
│   │   ├── card/
│   │   │   ├── BusinessCard.jsx      # Main 3D card component (Three.js)
│   │   │   ├── cardRenderer.js       # 3D rendering logic
│   │   │   └── cardScene.js          # Three.js scene setup
│   │   │
│   │   ├── shared/
│   │   │   ├── Navbar.jsx            # Navigation bar with auth state
│   │   │   └── Modal.jsx             # Reusable modal wrapper
│   │   │
│   │   └── landing/
│   │       ├── Hero.jsx              # Main landing hero section
│   │       └── HowItWorksModal.jsx   # 4-step workflow modal
│   │
│   ├── config/
│   │   ├── themes/
│   │   │   ├── darkTheme.js          # 7 dark theme color objects
│   │   │   └── lightTheme.js         # 7 light theme color objects
│   │   │
│   │   ├── materials.js              # Material presets with 3D properties
│   │   ├── defaultCard.js            # Card template structure
│   │   ├── demoCard.js               # Sample data (Sarah Johnson)
│   │   ├── layoutPresets.js          # Layout configuration
│   │   └── fontPresets.js            # Typography options
│   │
│   ├── context/
│   │   └── AuthContext.jsx           # Global auth state + provider
│   │
│   ├── hooks/
│   │   ├── useUserCard.js            # Card CRUD operations
│   │   ├── usePublicCard.js          # Fetch public cards
│   │   ├── useAIImport.js            # AI data extraction
│   │   └── useLogoUpload.js          # Image processing
│   │
│   ├── pages/
│   │   ├── LandingPage.jsx           # Public marketing homepage
│   │   ├── EditorPage.jsx            # Protected card editor
│   │   └── PublicCardPage.jsx        # Read-only public card
│   │
│   ├── utils/
│   │   ├── security.js               # Input validation
│   │   ├── qrcode.js                 # QR generation
│   │   └── cardUtils.js              # Card utilities
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── api/
│   └── ai-import.js                  # Llama API integration
│
├── public/
├── .env.local                        # [Not committed] Environment variables
├── .env.example                      # Template
├── vite.config.js
├── package.json
└── README.md
```

## 📚 Module Documentation

### Core Hooks

#### `useUserCard.js`
Manages all card CRUD operations and persistence.

```javascript
// Returns an object with:
{
  card: Object,           // Current card data
  loading: boolean,       // Loading state
  error: string | null,   // Error message
  updateCard: async (cardUpdates) => Promise,
  deleteCard: async () => Promise,
  shareCard: async (shareSettings) => Promise
}
```

**Key Functions**:
- `updateCard(cardData)` - Saves changes to Firestore in real-time
- `shareCard(settings)` - Creates shareable link with optional restrictions
- `deleteCard()` - Permanently removes card from database

#### `usePublicCard.js`
Fetches card data by username for public viewing.

```javascript
{
  card: Object,
  username: string,
  loading: boolean,
  error: string | null,
  refresh: () => Promise
}
```

#### `useAIImport.js`
Integrates with Llama API for intelligent data extraction.

```javascript
{
  extracting: boolean,
  error: string | null,
  parseResume: async (text) => Promise<CardData>,
  parsePDF: async (file) => Promise<CardData>,
  extractFields: async (text, fieldNames) => Promise<Object>
}
```

**AI Processing Pipeline**:
- Validates and preprocesses text/PDF input
- Sends to Llama API for intelligent field extraction
- Maps results to card data structure
- Merges non-destructively with existing data

#### `useLogoUpload.js`
Handles image upload, compression, and validation.

```javascript
{
  uploading: boolean,
  progress: number,  // 0-100
  error: string | null,
  uploadLogo: async (file) => Promise<{ url, size }>
}
```

**Image Processing Pipeline**:
1. Validate MIME type (PNG, JPG, WebP)
2. Validate file size (< 512 KB)
3. Compress to WebP (80-90% quality)
4. Upload to Firebase Storage
5. Generate download URL with cache headers

### Configuration Modules

#### `themes.js`
Defines color palettes for dark and light modes.

```javascript
// 7 dark themes: Midnight, Slate, Navy, Charcoal, etc.
// 7 light themes: Vanilla, Cloud, Sky, Pearl, etc.
// Each with: primary, accent, text, background colors
```

#### `materials.js`
3D material presets for card surfaces.

```javascript
{
  default: { metalness: 0.3, roughness: 0.4 },
  glossy: { metalness: 0.8, roughness: 0.1 },
  matte: { metalness: 0.0, roughness: 0.9 },
  // ... more presets
}
```

## 🎨 Design Decisions

### Why Three.js for 3D?
- **Mature ecosystem** with excellent documentation
- **WebGL abstraction** handles device compatibility
- **Performance optimizations** like frustum culling, LOD
- **Large community** with countless examples

### Why Context API over Redux?
- **Smaller bundle size** (5KB vs 40KB+)
- **Sufficient for current scale** (single auth context)
- **Less boilerplate** with hooks
- **Future migration path** if complexity grows

### Why Firestore over PostgreSQL?
- **Real-time synchronization** without WebSocket management
- **Automatic scaling** - no database provisioning
- **Built-in security rules** - enforced at database layer
- **Free tier generosity** - 1M reads/month free
- **Effective offline support** with Firestore SDK

### Why Vercel for Hosting?
- **Optimal React deployment** with autoscaling
- **Edge Functions** for serverless API routes
- **Automatic HTTPS** and DDoS protection
- **Vercel Analytics** integrated at no extra cost
- **Preview deployments** for every pull request

## 🔧 Configuration

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - read/write own profile only
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == userId;
    }
    
    // Business cards - public read, private write
    match /cards/{username} {
      allow read: if true;  // Public viewing
      allow write, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.username == username;
    }
    
    // Username reservations - check availability, create once
    match /usernames/{username} {
      allow read: if true;  // Check availability
      allow create: if request.auth != null && 
                       !exists(/databases/$(database)/documents/usernames/$(username));
      allow write, delete: if false;  // Immutable
    }
  }
}
```

### Content Limits

| Field | Limit | Rationale |
|-------|-------|-----------|
| Name | 100 chars | Display legibility |
| Job Title | 100 chars | Card layout constraints |
| Tagline | 200 chars | Readable summary |
| Email | 254 chars | RFC standard |
| Phone | 20 chars | International format |
| Bio | 500 chars | Avoid overflow |
| Social links | 6 max | UI space |
| Logo file size | 512 KB | Storage optimization |
| Logo aspect ratio | 1:1 | Card consistency |

## 🚀 Deployment

### Automatic Deployment (Vercel)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Vercel auto-deploys** from `main` branch

3. **Add environment variables** in Vercel Dashboard:
   - Project Settings > Environment Variables
   - Add all variables from `.env.local`
   - Redeploy project

4. **Configure custom domain** (optional):
   - Vercel > Domains > Add custom domain
   - Update DNS records at registrar

### Manual Build for Self-Hosting

```bash
# Create production build
npm run build

# Test locally
npm run preview

# Deploy dist/ folder to your server
```

### Performance Optimization Checklist

- [ ] Enable gzip compression on web server
- [ ] Set up CDN for image/asset delivery
- [ ] Configure service worker for offline support
- [ ] Monitor Core Web Vitals in Vercel Dashboard
- [ ] Set up 404 redirects to index.html for SPA routing
- [ ] Enable Firebase database backup

## 📊 Performance Metrics

**Lighthouse Scores** (Target):
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 95+

**Real User Monitoring**:
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**3D Performance**:
- 3D card rendering: 60 FPS on modern devices
- Particle system: 300-500 particles at 60 FPS
- Animation frame budget: < 16ms per frame

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup
```bash
git checkout -b feature/your-feature-name
npm install
npm run dev
```

### Code Standards
- Use ESLint configuration (`npm run lint`)
- Follow Prettier formatting (`npm run format`)
- Add tests for new features (`npm test`)
- Update documentation for API changes

### Commit Messages
```
feat: Add new feature description
fix: Fix bug description
docs: Update documentation
style: Code style changes
refactor: Code refactoring without feature changes
test: Add or update tests
```

### Pull Request Process
1. Update CHANGELOG.md
2. Add unit tests
3. Ensure all checks pass
4. Request review from maintainers
5. Merge after approval

## 🔐 Security Considerations

- **Input Validation**: All user inputs validated server-side
- **XSS Prevention**: HTML sanitization on all text fields
- **CSRF Protection**: Firebase handles token management
- **Data Encryption**: HTTPS for all communications, TLS 1.2+
- **API Keys**: Never exposed in client-side code
- **Firestore Rules**: Enforce least-privilege access

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Three.js](https://threejs.org/) - 3D rendering library
- [Firebase](https://firebase.google.com/) - Backend services
- [Vercel](https://vercel.com/) - Hosting platform
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Llama API](https://api.llama.ai) - AI extraction service

## 📞 Contact & Support

**Creator**: Rohan Dalvi  
**Email**: dalvi.ro@northeastern.edu  
**LinkedIn**: [linkedin.com/in/rohandalvi](https://linkedin.com/in/rohandalvi)  
**GitHub**: [@RohanRajendraDalvi](https://github.com/RohanRajendraDalvi)

**Project Links**:
- Live Demo: [craftdigitalcards.vercel.app](https://craftdigitalcards.vercel.app)
- Repository: [github.com/RohanRajendraDalvi/Digital-Business-Cards](https://github.com/RohanRajendraDalvi/Digital-Business-Cards)
- Issue Tracker: [GitHub Issues](https://github.com/RohanRajendraDalvi/Digital-Business-Cards/issues)

---

**Last Updated**: February 25, 2026  
**Version**: 1.0.0