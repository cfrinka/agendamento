# 🚀 Quick Start Guide

## Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Copy `.env.example` to `.env.local`
3. Add your Firebase credentials to `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 3: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Next Steps

### For Full Production Setup

Follow the complete guide: **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)**

### Key Documentation

- **[README.md](README.md)** - Project overview
- **[docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** - Architecture and features
- **[docs/FIRESTORE_DATA_MODEL.md](docs/FIRESTORE_DATA_MODEL.md)** - Database schema
- **[docs/USER_FLOWS.md](docs/USER_FLOWS.md)** - User workflows

---

## Test Real-time Functionality

1. Open two browser windows
2. Login as different users
3. Both view the same calendar
4. Create appointment in window 1
5. **Verify it appears instantly in window 2** ✅

---

## Need Help?

- Check `/docs` folder for detailed documentation
- Review Firebase Console for logs
- All TypeScript errors about Firebase will resolve after `npm install`

---

**Ready to build? Start with `npm run dev`** 🎉
