# Connect to Local MongoDB in Compass

## Step 1: Connect in MongoDB Compass

1. In MongoDB Compass, click the **"Add new connection"** button (green button with +)

2. In the connection string field, enter:
   ```
   mongodb://localhost:27017
   ```
   
   Or use the full connection string:
   ```
   mongodb://localhost:27017/mavy-platform
   ```

3. Click **"Connect"**

4. You should now see your local MongoDB connection! ✅

## Step 2: Create .env File

Create a file named `.env` in the `backend` folder with this content:

```
PORT=3000
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/mavy-platform
NODE_ENV=development
JWT_SECRET=mavy-platform-secret-key-change-in-production
FAST2SMS_API_KEY=
RESEND_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=
```

**Important:** The `.env` file should be in the `backend` folder, not the root folder.

## Step 3: Test MongoDB Connection

Open PowerShell in the project root and run:

```powershell
cd backend
npm run test:mongodb
```

You should see: `✅ MongoDB connected successfully!`

## Step 4: Start Backend Server

If the test passes, start your backend:

```powershell
npm run dev
```

You should see:
```
Server running on port 3000
MongoDB connected successfully
```

## Step 5: Verify in Compass

After starting the backend, go back to MongoDB Compass and refresh. You should see:
- A database named `mavy-platform` (or your database name)
- Collections will be created automatically when you use the APIs

## Troubleshooting

### Can't connect in Compass
- Make sure MongoDB service is running: `net start MongoDB`
- Try the connection string: `mongodb://127.0.0.1:27017`

### Connection test fails
- Check if MongoDB service is running
- Verify the `.env` file is in the `backend` folder
- Make sure the connection string is correct

