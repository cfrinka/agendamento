# Setup Guide - Medical Appointment Scheduling System

## Overview
Complete setup guide for deploying the Firebase-based medical appointment scheduling system for Brazilian private clinics.

---

## Prerequisites

- Node.js 18+ and npm
- Firebase account
- Git
- Code editor (VS Code recommended)

---

## 1. Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `agendamento-medico-prod`
4. Enable Google Analytics (optional)
5. Create project

### 1.2 Enable Firebase Services

**Authentication:**
1. Navigate to Authentication
2. Click "Get started"
3. Enable "Email/Password" provider
4. Save

**Firestore Database:**
1. Navigate to Firestore Database
2. Click "Create database"
3. Select location: `southamerica-east1` (São Paulo)
4. Start in **production mode** (we'll deploy rules later)
5. Create database

**Cloud Functions:**
1. Navigate to Functions
2. Click "Get started"
3. Upgrade to Blaze plan (pay-as-you-go)
4. Note: Free tier is generous, typical clinic costs ~$5-20/month

**Cloud Storage (optional):**
1. Navigate to Storage
2. Click "Get started"
3. Start in production mode
4. Create bucket

### 1.3 Get Firebase Configuration

1. Navigate to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon (</>) to add web app
4. Register app name: `Agendamento Web`
5. Copy Firebase configuration object
6. Save for later

---

## 2. Local Development Setup

### 2.1 Clone Repository

```bash
cd c:\Code
git clone <your-repo-url> agendamento
cd agendamento
```

### 2.2 Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Firebase tools globally
npm install -g firebase-tools

# Install Firebase dependencies
npm install firebase firebase-admin

# Install additional dependencies
npm install @tanstack/react-query date-fns lucide-react
npm install -D @types/node
```

### 2.3 Configure Environment Variables

Create `.env.local` file in project root:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Emulator
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

Replace values with your Firebase configuration from step 1.3.

### 2.4 Update .gitignore

Ensure `.env.local` is in `.gitignore`:

```gitignore
# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log
```

---

## 3. Firebase CLI Setup

### 3.1 Login to Firebase

```bash
firebase login
```

### 3.2 Initialize Firebase

```bash
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Hosting (optional)

Configuration:
- **Firestore rules:** `firestore.rules`
- **Firestore indexes:** `firestore.indexes.json`
- **Functions language:** TypeScript
- **Functions directory:** `functions`
- **Hosting directory:** `out` (for Next.js static export)

### 3.3 Set Firebase Project

```bash
firebase use --add
```

Select your project and give it an alias (e.g., `production`).

---

## 4. Deploy Firestore Security Rules

### 4.1 Review Rules

Open `firestore.rules` and review the security rules we created.

### 4.2 Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### 4.3 Verify Rules

1. Go to Firebase Console → Firestore Database
2. Click "Rules" tab
3. Verify rules are deployed

---

## 5. Create Firestore Indexes

### 5.1 Create firestore.indexes.json

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clinicId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clinicId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "doctorId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "patientId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clinicId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clinicId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "appointmentId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### 5.2 Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

Indexes will take a few minutes to build. Monitor progress in Firebase Console.

---

## 6. Setup Cloud Functions

### 6.1 Navigate to Functions Directory

```bash
cd functions
```

### 6.2 Install Dependencies

```bash
npm install
```

### 6.3 Configure Functions

Create `functions/src/index.ts`:

```typescript
import * as admin from 'firebase-admin';

admin.initializeApp();

// Import all function modules
export * from './appointments';
export * from './agenda';
export * from './notifications';
export * from './maintenance';
export * from './reports';
```

### 6.4 Create Function Files

Create the following files in `functions/src/`:

- `appointments.ts` - Appointment management functions
- `agenda.ts` - Booking window functions
- `notifications.ts` - Notification functions
- `maintenance.ts` - Scheduled maintenance functions
- `reports.ts` - Report generation functions

Copy the function implementations from `docs/CLOUD_FUNCTIONS.md`.

### 6.5 Deploy Functions

```bash
# From project root
firebase deploy --only functions
```

This will deploy all Cloud Functions. First deployment takes 5-10 minutes.

---

## 7. Setup Cloud Scheduler

### 7.1 Enable Cloud Scheduler API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Enable Cloud Scheduler API

### 7.2 Verify Scheduled Functions

Scheduled functions are automatically created when you deploy:
- `sendAppointmentReminders` - Runs every 15 minutes
- `expireBookingWindowExtensions` - Runs daily
- `markNoShows` - Runs hourly

Verify in Firebase Console → Functions → Logs.

---

## 8. Initial Data Setup

### 8.1 Create Admin User

Use Firebase Console to create first admin user:

1. Go to Authentication
2. Click "Add user"
3. Enter email and password
4. Copy the UID

### 8.2 Create Initial Clinic Document

Use Firestore Console to create clinic:

1. Go to Firestore Database
2. Create collection: `clinics`
3. Add document with ID: `clinic_001`
4. Copy structure from `docs/FIRESTORE_DATA_MODEL.md`
5. Fill with your clinic data

### 8.3 Create Admin User Document

1. Create collection: `users`
2. Add document with ID: (the UID from step 8.1)
3. Structure:

```json
{
  "id": "user_admin_uid",
  "email": "admin@clinica.com.br",
  "name": "Admin Name",
  "phone": "+5511999999999",
  "role": "admin",
  "clinicId": "clinic_001",
  "permissions": {
    "canManageUsers": true,
    "canManageDoctors": true,
    "canManageConvenios": true,
    "canExtendAgenda": true,
    "canViewReports": true,
    "canManageAppointments": true
  },
  "active": true,
  "createdAt": "2025-01-05T12:00:00Z",
  "updatedAt": "2025-01-05T12:00:00Z"
}
```

---

## 9. Run Development Server

### 9.1 Start Next.js Dev Server

```bash
npm run dev
```

### 9.2 Open Browser

Navigate to `http://localhost:3000`

### 9.3 Login

Use the admin credentials you created in step 8.1.

---

## 10. Testing Real-time Functionality

### 10.1 Open Multiple Windows

1. Open browser window 1: Login as admin
2. Open browser window 2 (incognito): Login as secretary
3. Both navigate to calendar

### 10.2 Test Real-time Updates

1. In window 1: Create appointment
2. **Verify:** Appointment appears in window 2 instantly
3. In window 2: Cancel appointment
4. **Verify:** Cancellation appears in window 1 instantly

### 10.3 Test Conflict Prevention

1. Both windows: Open booking form for same doctor/date
2. Window 1: Book slot at 09:00
3. **Verify:** Slot disappears from window 2 instantly
4. Window 2: Try to book same slot
5. **Verify:** Error message shown

---

## 11. Production Deployment

### 11.1 Build Next.js App

```bash
npm run build
```

### 11.2 Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

Or deploy to Firebase Hosting:

```bash
# Export static site
npm run build
npm run export

# Deploy
firebase deploy --only hosting
```

### 11.3 Configure Custom Domain

1. Go to Vercel/Firebase Hosting settings
2. Add custom domain
3. Update DNS records
4. Enable SSL

---

## 12. WhatsApp Integration (Optional)

### 12.1 Choose Provider

Options:
- **Twilio** - Most reliable, $$$
- **WhatsApp Business API** - Official, requires approval
- **Baileys** - Open source, self-hosted

### 12.2 Setup Twilio (Example)

```bash
npm install twilio
```

Configure in Cloud Functions:

```bash
firebase functions:config:set \
  twilio.account_sid="YOUR_ACCOUNT_SID" \
  twilio.auth_token="YOUR_AUTH_TOKEN" \
  twilio.whatsapp_number="whatsapp:+14155238886"
```

Update `functions/src/notifications.ts` with Twilio integration.

---

## 13. Monitoring & Logging

### 13.1 Enable Cloud Logging

1. Go to Google Cloud Console
2. Navigate to Logging
3. Create log-based metrics for:
   - Appointment creation rate
   - Error rate
   - Function execution time

### 13.2 Setup Alerts

1. Navigate to Monitoring → Alerting
2. Create alert policies:
   - High error rate
   - Slow function execution
   - High costs

### 13.3 Enable Firebase Performance Monitoring

```bash
npm install firebase/performance
```

Add to `lib/firebase.ts`:

```typescript
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(app);
```

---

## 14. Backup & Recovery

### 14.1 Setup Automated Backups

Create Cloud Scheduler job:

```bash
gcloud scheduler jobs create http firestore-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default):exportDocuments" \
  --message-body='{"outputUriPrefix":"gs://YOUR_BUCKET/backups"}' \
  --oauth-service-account-email=YOUR_SERVICE_ACCOUNT
```

### 14.2 Test Restore

1. Export data manually
2. Delete test document
3. Restore from backup
4. Verify data integrity

---

## 15. Security Checklist

- ✅ Firestore Security Rules deployed
- ✅ Environment variables not in git
- ✅ HTTPS enabled
- ✅ Authentication required for all routes
- ✅ Role-based access control working
- ✅ Sensitive data encrypted
- ✅ LGPD consent implemented
- ✅ Audit logs enabled
- ✅ Rate limiting configured
- ✅ CORS configured properly

---

## 16. Performance Optimization

### 16.1 Enable Caching

```typescript
// lib/cache.ts
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCached(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

export function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}
```

### 16.2 Optimize Queries

- Limit date ranges to necessary periods
- Use pagination for large lists
- Cache static data (doctors, convênios)
- Unsubscribe from listeners when not needed

### 16.3 Monitor Costs

1. Go to Firebase Console → Usage and billing
2. Set budget alerts
3. Monitor:
   - Firestore reads/writes
   - Function invocations
   - Storage usage

---

## 17. Troubleshooting

### Issue: Real-time updates not working

**Solution:**
1. Check browser console for errors
2. Verify Firestore rules allow read access
3. Check network tab for WebSocket connection
4. Verify indexes are built

### Issue: Functions timing out

**Solution:**
1. Increase function timeout in `firebase.json`
2. Optimize query performance
3. Use batched operations
4. Check for infinite loops

### Issue: Permission denied errors

**Solution:**
1. Review Firestore Security Rules
2. Check user role and permissions
3. Verify clinicId matches
4. Check audit logs

### Issue: High costs

**Solution:**
1. Review query patterns
2. Implement caching
3. Optimize indexes
4. Use pagination
5. Limit real-time listeners scope

---

## 18. Support & Maintenance

### Daily Tasks
- Monitor error logs
- Check appointment creation rate
- Verify notifications sent

### Weekly Tasks
- Review audit logs
- Check system performance
- Analyze user feedback

### Monthly Tasks
- Generate reports
- Review costs
- Update dependencies
- Backup verification

---

## 19. Next Steps

After successful setup:

1. ✅ Create test appointments
2. ✅ Invite team members
3. ✅ Configure clinic settings
4. ✅ Add doctors
5. ✅ Add convênios
6. ✅ Test all user flows
7. ✅ Train staff
8. ✅ Go live!

---

## 20. Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [LGPD Compliance Guide](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

---

## Support

For issues or questions:
- Check documentation in `/docs` folder
- Review error logs in Firebase Console
- Contact development team

---

**Congratulations! Your medical appointment scheduling system is now ready for production use.** 🎉
