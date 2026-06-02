# Restaurant Website

A full-featured restaurant website with a CMS admin dashboard, role-based access control, approval workflow, and delivery platform integration.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Firebase (Auth + Firestore + Storage) · Cloudflare Pages

---

## Features

| Feature | Details |
|---|---|
| Public website | Hero, About, Menu, Gallery, Order, Hours, Location, Contact |
| Order Now page | Uber Eats, DoorDash, Grubhub with configurable URLs |
| Admin dashboard | Full CMS — menu, gallery, settings, delivery, users |
| Role system | Developer · Admin · Assistant with approval workflow |
| Approval queue | Assistants submit changes; Admins approve/reject |
| Audit logs | Every action logged with user, time, and details |
| Analytics | Activity feed and content stats |
| Firebase storage | Drag-and-drop image/video uploads |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create a project**
2. Enable **Authentication** → Sign-in method → **Email/Password**
3. Enable **Firestore Database** (start in production mode)
4. Enable **Storage**
5. Go to **Project Settings → Service Accounts** → **Generate new private key** (save the JSON file)

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Firebase Client** (from Project Settings → General → Your apps → Web app):
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Firebase Admin** (from the service account JSON):
```
FIREBASE_PROJECT_ID=         # same as above
FIREBASE_CLIENT_EMAIL=       # client_email from JSON
FIREBASE_PRIVATE_KEY=        # private_key from JSON (keep the quotes)
```

**Initial developer account:**
```
INITIAL_DEV_EMAIL=developer@yourrestaurant.com
INITIAL_DEV_PASSWORD=YourSecurePassword123!
INITIAL_DEV_NAME=Developer
```

### 4. Deploy Firestore rules and indexes

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 5. Run first-time setup

Start the dev server, then call the setup endpoint once:

```bash
npm run dev
```

In a separate terminal:
```bash
curl -X POST http://localhost:3000/api/setup
```

This creates:
- Your Developer account
- Default restaurant settings
- Sample menu (Starters, Mains, Desserts, Beverages with 8 items)
- Delivery platform slots (unconfigured)

### 6. Login

Navigate to `http://localhost:3000/auth/login` and sign in with your developer credentials.

---

## Deploying to Cloudflare Pages

### Option A — Git Integration (Recommended)

1. Push your project to GitHub
2. Open [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Pages** → **Create a project**
3. Connect your GitHub repo
4. Build settings:
   - **Framework preset:** Next.js
   - **Build command:** `npx @cloudflare/next-on-pages@1`
   - **Build output directory:** `.vercel/output/static`
5. Add all environment variables from `.env.local` in the **Environment variables** section
6. Add compatibility flags in **Settings → Functions**:
   - Compatibility flag: `nodejs_compat`
   - Compatibility date: `2024-09-23`
7. Deploy!

### Option B — Manual Deploy

```bash
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name=restaurant-website
```

### After deployment

Run setup on production (replace URL):
```bash
curl -X POST https://your-site.pages.dev/api/setup
```

---

## Project Structure

```
src/
├── app/
│   ├── (public)/           # Customer-facing pages
│   │   ├── page.tsx        # Home (all sections)
│   │   ├── menu/           # Full menu page
│   │   ├── gallery/        # Photo & video gallery
│   │   └── order/          # Delivery platform selector
│   ├── auth/login/         # Staff login
│   ├── admin/              # Protected admin area
│   │   ├── page.tsx        # Dashboard
│   │   ├── menu/           # Menu editor
│   │   ├── gallery/        # Gallery manager
│   │   ├── settings/       # Restaurant settings & branding
│   │   ├── delivery/       # Delivery platform URLs
│   │   ├── users/          # User management
│   │   ├── approvals/      # Change approval queue
│   │   └── analytics/      # Activity logs & stats
│   └── api/
│       ├── users/          # User CRUD (Firebase Admin SDK)
│       └── setup/          # First-time setup endpoint
├── components/
│   ├── layout/             # Header, Footer
│   ├── public/             # Hero, About, Menu, Gallery, etc.
│   ├── admin/              # Sidebar, AdminHeader
│   └── ui/                 # Button, Input, Modal, Badge, etc.
├── contexts/AuthContext.tsx # Firebase Auth + role state
├── lib/
│   ├── firebase.ts         # Client SDK
│   ├── firebaseAdmin.ts    # Admin SDK (API routes only)
│   ├── firestore.ts        # All Firestore operations
│   └── utils.ts            # Helpers, defaults
└── types/index.ts          # TypeScript interfaces
```

---

## User Roles

| Role | Access |
|---|---|
| **Developer** | Full unrestricted access. Can manage all users including other Developers. |
| **Admin** | Manage all content, settings, delivery URLs, approve/reject changes, manage Assistants. |
| **Assistant** | Upload media and suggest text/menu changes. All changes go into an approval queue — nothing goes live until an Admin approves. |

---

## Firestore Collections

| Collection | Description |
|---|---|
| `settings/restaurant` | Single doc — restaurant name, hours, branding, social links |
| `menuCategories` | Ordered categories (Starters, Mains, etc.) |
| `menuItems` | Individual dishes linked to categories |
| `gallery` | Photos and videos with captions |
| `deliveryPlatforms` | Uber Eats, DoorDash, Grubhub URL config |
| `pendingChanges` | Assistant submissions awaiting Admin review |
| `auditLogs` | Immutable log of every action |
| `users` | Staff profiles with roles |

---

## Customisation

### Change the restaurant name / branding
Log in as Admin or Developer → **Settings** → **General** → Update name, logo, hero image, etc.

### Connect delivery platforms
**Delivery** page → Paste your restaurant's URL from each app.

### Add staff
**Users** → **Add User** → Enter name, email, password, and role.

### Theme colours
Edit `tailwind.config.ts` → `theme.extend.colors.primary` to change the brand colour.

---

## Firebase Setup Checklist

- [ ] Firebase project created
- [ ] Email/Password auth enabled
- [ ] Firestore in production mode
- [ ] Storage enabled
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] All env vars set in Cloudflare Pages
- [ ] `nodejs_compat` flag enabled
- [ ] `/api/setup` called once after deployment
