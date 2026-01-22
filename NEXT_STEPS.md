# Next Steps - Deployment Checklist

## ✅ Completed
- [x] MongoDB instance set up (local/Atlas)
- [x] Backend APIs built (Node.js + Express)
- [x] Authentication working (OTP login)
- [x] CRUD operations working (Create, Read, Update, Delete)
- [x] Image upload working

## 📋 Remaining Tasks

### Step 1: Test Reporting Dashboard (Analytics)
**Goal:** Verify the analytics/reporting dashboard works end-to-end

**How to Test:**
1. Navigate to: `http://localhost:5173/admin/dashboard`
2. Log in (you may need admin privileges - check if your user is an admin)
3. Click on "Analytics" tab (should be the default view)
4. Verify you see:
   - Total users/partners/patients
   - Recent activity statistics
   - Charts/graphs (if any)
   - Booking statistics
   - Service statistics

**If you can't access admin dashboard:**
- Check if your user has admin privileges in the database
- Or test the analytics API directly: `GET /api/admin/analytics`

**Expected Outcome:** Dashboard loads and displays data without errors.

---

### Step 2: Set Up Hostinger Git Repository
**Goal:** Connect your local code to Hostinger's Git repository

**Steps:**
1. **Get Hostinger Git Repository URL:**
   - Log into your Hostinger account
   - Go to "Git" or "Version Control" section
   - Create a new repository (if not exists)
   - Copy the repository URL (e.g., `git@hostinger.com:username/repo.git`)

2. **Initialize Git (if not already):**
   ```powershell
   cd "D:\my project\MERN\1-23"
   git init
   ```

3. **Add Hostinger Remote:**
   ```powershell
   git remote add origin YOUR_HOSTINGER_GIT_URL
   ```

4. **Create .gitignore (if not exists):**
   - Ensure `.env` files are ignored
   - Ensure `node_modules` are ignored
   - Ensure build artifacts are ignored

---

### Step 3: Configure Production Environment Variables
**Goal:** Set up environment variables for production

**Create Production `.env` Files:**

**Backend `.env` (for production):**
```env
NODE_ENV=production
PORT=3000
MONGODB_URI_ATLAS=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret_key
CORS_ORIGIN=https://yourdomain.com
FAST2SMS_API_KEY=your_fast2sms_api_key (if using SMS)
```

**Frontend `.env` (for production):**
```env
VITE_API_URL=https://yourdomain.com/api
```

**Note:** These should be set in Hostinger's environment variable settings, NOT committed to Git.

---

### Step 4: Set Up Auto-Deploy Configuration
**Goal:** Configure automatic deployment on Git push

**Options:**

**Option A: Hostinger Auto-Deploy (if available)**
1. In Hostinger dashboard, enable "Auto-Deploy"
2. Configure build commands:
   - **Backend:** `cd backend && npm install && npm run build`
   - **Frontend:** `cd frontend && npm install && npm run build`
3. Set start command: `cd backend && npm start`

**Option B: GitHub Actions (if using GitHub)**
1. Create `.github/workflows/deploy.yml`
2. Configure workflow to:
   - Build frontend and backend
   - Deploy to Hostinger

**Option C: Manual Deploy Script**
- Create a deployment script that builds and uploads files

---

### Step 5: Build Production-Ready Code
**Goal:** Create optimized production builds

**Backend Build:**
```powershell
cd backend
npm install
npm run build
```

**Frontend Build:**
```powershell
cd frontend
npm install
npm run build
```

**Verify Builds:**
- Backend: Check `backend/dist/` folder exists
- Frontend: Check `frontend/dist/` folder exists

---

### Step 6: Push Code to Hostinger Git
**Goal:** Upload code to repository

**Steps:**
```powershell
cd "D:\my project\MERN\1-23"
git add .
git commit -m "Initial deployment - Mavy Healthcare Platform"
git push -u origin main
```

**Note:** If Hostinger uses a different branch name (e.g., `master`), adjust accordingly.

---

### Step 7: Configure Hostinger Production Environment
**Goal:** Set up production server on Hostinger

**Steps:**
1. **Set Environment Variables:**
   - In Hostinger dashboard, add all production environment variables
   - MongoDB connection string
   - JWT secret
   - API keys
   - CORS origin

2. **Configure Node.js:**
   - Set Node.js version (recommended: 18.x or 20.x)
   - Set start command: `cd backend && npm start`
   - Set build command: `cd backend && npm install && npm run build`

3. **Configure Static Files:**
   - Set static file directory to `frontend/dist`
   - Configure routing (all routes should serve `index.html` for SPA)

4. **Configure Port:**
   - Backend should use `PORT` environment variable
   - Frontend should proxy API requests to backend

---

### Step 8: Deploy and Verify Live Site
**Goal:** Make the site live and verify it works

**Steps:**
1. **Trigger Deployment:**
   - If auto-deploy is enabled, push to Git
   - If manual, follow Hostinger's deployment process

2. **Verify Deployment:**
   - Check deployment logs in Hostinger dashboard
   - Ensure no build errors

3. **Test Live Site:**
   - Visit your domain: `https://yourdomain.com`
   - Test sign up / sign in
   - Create a sample record (service)
   - View the record (READ)
   - Edit the record (UPDATE)
   - Delete the record (DELETE)
   - Access admin dashboard and view reports

**Expected Outcome:** All functionality works on live site.

---

### Step 9: Create Setup Notes for Client
**Goal:** Document the setup for hand-off

**Create `SETUP_NOTES.md` with:**
- How to access the admin dashboard
- How to add new admins
- How to update environment variables
- How to deploy updates
- MongoDB connection details
- Important URLs and endpoints
- Troubleshooting common issues

---

## Quick Reference

### Test Analytics Dashboard Now:
```
http://localhost:5173/admin/dashboard
```

### Test Analytics API:
```javascript
// In browser console (while logged in):
fetch('/api/admin/analytics', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

### Current Status:
- ✅ Backend: Working
- ✅ Frontend: Working
- ✅ MongoDB: Connected
- ✅ CRUD: Working
- ⏳ Analytics: Needs testing
- ⏳ Deployment: Pending

---

## Priority Order:
1. **Test Analytics Dashboard** (5 minutes)
2. **Get Hostinger Git URL** (5 minutes)
3. **Set up Git repository** (10 minutes)
4. **Configure production environment** (15 minutes)
5. **Build and deploy** (20 minutes)
6. **Verify live site** (10 minutes)
7. **Create setup notes** (15 minutes)

**Total Estimated Time:** ~1.5 hours

---

## Need Help?
- Check Hostinger documentation for Git and deployment
- Verify MongoDB Atlas connection string is correct
- Ensure all environment variables are set
- Check server logs for errors

