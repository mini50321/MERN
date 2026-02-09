# Hostinger FTP Deployment Guide

## Step 1: Build Your Application

### Build Backend
```bash
cd backend
npm install
npm run build
```

This creates `backend/dist/` folder with compiled JavaScript.

### Build Frontend
```bash
cd frontend
npm install
npm run build
```

This creates `frontend/dist/client/` folder with production-ready files.

## Step 2: Get FTP Credentials from Client

Ask your client for:
- **FTP Host/Server**: (e.g., `ftp.yourdomain.com` or IP address)
- **FTP Username**: 
- **FTP Password**: 
- **FTP Port**: (usually 21)
- **Root Directory**: (usually `/public_html` or `/domains/yourdomain.com/public_html`)

## Step 3: Connect via FileZilla or WinSCP

### Using FileZilla:
1. Download FileZilla: https://filezilla-project.org/
2. Open FileZilla
3. Enter credentials:
   - Host: [FTP Host from client]
   - Username: [FTP Username]
   - Password: [FTP Password]
   - Port: 21
4. Click "Quickconnect"

### Using WinSCP:
1. Download WinSCP: https://winscp.net/
2. Open WinSCP
3. Enter credentials (same as above)
4. Click "Login"

## Step 4: Upload Files to Server

### Upload Structure:
```
/public_html/
├── backend/          (upload entire backend folder)
│   ├── dist/         (compiled backend code)
│   ├── package.json
│   └── node_modules/ (will install on server)
├── frontend/
│   └── dist/
│       └── client/   (upload this entire client folder)
└── .env              (create this file on server)
```

### What to Upload:

1. **Backend Files:**
   - Upload entire `backend/` folder
   - Include: `dist/`, `package.json`, `package-lock.json`
   - Do NOT upload: `src/`, `node_modules/` (install on server)

2. **Frontend Files:**
   - Upload `frontend/dist/client/` folder contents
   - Upload to: `/public_html/` (root of website)

3. **Environment File:**
   - Create `.env` file in `backend/` folder on server
   - Copy from `backend/.env.example` and fill in values

## Step 5: SSH into Server (via Hostinger)

1. Go to Hostinger hPanel
2. Find "SSH Access" or "Terminal"
3. Connect via SSH

## Step 6: Install Dependencies and Start

### On Server (via SSH):
```bash
# Navigate to backend directory
cd /public_html/backend

# Install dependencies
npm install --production

# Start the application
npm start
```

## Step 7: Set Up PM2 (Recommended for Production)

PM2 keeps your Node.js app running:

```bash
# Install PM2 globally
npm install -g pm2

# Start your app with PM2
cd /public_html/backend
pm2 start dist/server.js --name "mavy-backend"

# Save PM2 configuration
pm2 save

# Set PM2 to start on server reboot
pm2 startup
```

## Step 8: Configure Environment Variables

Create `/public_html/backend/.env` file with:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
FAST2SMS_API_KEY=your_fast2sms_api_key
NODE_ENV=production
```

## Step 9: Configure Domain/Port

- If using port 3000, ensure Hostinger allows it
- Or configure reverse proxy to point domain to port 3000
- Check Hostinger documentation for Node.js app configuration

## Step 10: Test Deployment

1. Visit your domain: `https://yourdomain.com`
2. Check if frontend loads
3. Test API: `https://yourdomain.com/api/health`
4. Check server logs: `pm2 logs mavy-backend`

## Troubleshooting

### If app doesn't start:
```bash
# Check Node.js version
node --version

# Check if port is in use
netstat -tulpn | grep 3000

# Check PM2 status
pm2 status
pm2 logs mavy-backend
```

### If frontend doesn't load:
- Check if `frontend/dist/client/` files are in `/public_html/`
- Check backend is serving static files correctly
- Check browser console for errors

### If API doesn't work:
- Check backend is running: `pm2 status`
- Check MongoDB connection in `.env`
- Check server logs: `pm2 logs mavy-backend`

## Quick Checklist

- [ ] Built backend (`npm run build` in backend/)
- [ ] Built frontend (`npm run build` in frontend/)
- [ ] Got FTP credentials from client
- [ ] Connected via FileZilla/WinSCP
- [ ] Uploaded backend folder
- [ ] Uploaded frontend/dist/client/ contents
- [ ] Created .env file on server
- [ ] Installed dependencies on server (`npm install`)
- [ ] Started application (`npm start` or `pm2 start`)
- [ ] Tested website
- [ ] Tested API endpoints

