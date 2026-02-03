import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bookingRoutes from './routes/bookings.js';
import productRoutes from './routes/products.js';
import serviceManualRoutes from './routes/serviceManuals.js';
import jobRoutes from './routes/jobs.js';
import newsRoutes from './routes/news.js';
import commentsRoutes from './routes/comments.js';
import supportRoutes from './routes/support.js';
import analyticsRoutes from './routes/analytics.js';
import ribbonSettingsRoutes from './routes/ribbonSettings.js';
import exhibitionRoutes from './routes/exhibitions.js';
import oauthRoutes from './routes/oauth.js';
import servicesRoutes from './routes/services.js';
import serviceOrdersRoutes from './routes/serviceOrders.js';
import kycRoutes from './routes/kyc.js';
import connectRoutes from './routes/connect.js';
import gamificationRoutes from './routes/gamification.js';
import adsRoutes from './routes/ads.js';
import manualRequestsRoutes from './routes/manualRequests.js';
import coursesRoutes from './routes/courses.js';
import lessonsRoutes from './routes/lessons.js';
import fundraisersRoutes from './routes/fundraisers.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import pricingRoutes from './routes/pricing.js';
import notificationsRoutes from './routes/notifications.js';
import specialitiesRoutes from './routes/specialities.js';
import businessRoutes from './routes/business.js';
import chatRoutes from './routes/chat.js';
import contactRequestsRoutes from './routes/contactRequests.js';
import directMessagesRoutes from './routes/directMessages.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Mavy Backend API is running' });
});

app.use('/api/auth', authRoutes);
app.get('/api/logout', (_req, res) => {
  res.clearCookie('mavy_session');
  res.clearCookie('mocha_session_token');
  return res.json({ success: true });
});
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/onboarding', userRoutes);
app.use('/api/account', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/patient/bookings', bookingRoutes);
app.use('/api/patient', bookingRoutes);
app.use('/api/partner', bookingRoutes);
app.use('/api/business/products', productRoutes);
app.use('/api/products', productRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/service-manuals', serviceManualRoutes);
app.use('/api/manuals', serviceManualRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/ribbon-settings', ribbonSettingsRoutes);
app.use('/api/exhibitions', exhibitionRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/service-orders', serviceOrdersRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/connect', connectRoutes);
app.use('/api', gamificationRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/manual-requests', manualRequestsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/fundraisers', fundraisersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', adminRoutes);
app.use('/api', pricingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/specialities', specialitiesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/contact-requests', contactRequestsRoutes);
app.use('/api', directMessagesRoutes);
app.use('/api', settingsRoutes);


const projectRoot = path.resolve(__dirname, '../..');
const frontendDistPath = path.join(projectRoot, 'frontend/dist');


const clientPath = path.join(frontendDistPath, 'client');
const indexInClient = existsSync(path.join(clientPath, 'index.html'));
const indexInRoot = existsSync(path.join(frontendDistPath, 'index.html'));

let actualFrontendPath = frontendDistPath;
if (indexInClient) {
  actualFrontendPath = clientPath;
  console.log('Frontend found in:', actualFrontendPath);
} else if (indexInRoot) {
  console.log('Frontend found in:', actualFrontendPath);
} else {
  console.warn(`Frontend index.html not found. Checked:`);
  console.warn(`  - ${path.join(frontendDistPath, 'index.html')}`);
  console.warn(`  - ${path.join(clientPath, 'index.html')}`);
}

if (indexInClient || indexInRoot) {
  app.use(express.static(actualFrontendPath));
  

  app.get('*', (_req, res) => {
    res.sendFile(path.join(actualFrontendPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(404).json({ 
      error: 'Frontend not built. Please run: cd frontend && npm run build',
      checked: [frontendDistPath, clientPath]
    });
  });
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectDB();
});

