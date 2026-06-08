import express, { Express, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { initializeFunnelDatabase } from './config/funnelDatabase';
import { initializeEmailService } from './services/email';
import { initializeAzureEmailService } from './services/azureEmail';
import { authMiddleware, errorHandler } from './middleware/auth';
import { startExpiryCheckJob, startCleanupJob } from './jobs/expiryChecker';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import taskRoutes from './routes/tasks';
import notificationRoutes from './routes/notifications';
import portalNotificationRoutes from './routes/portalNotifications';
import adminRoutes from './routes/admin';
import usersRoutes from './routes/users';
import emdRoutes from './routes/emd';
import seplRoutes from './routes/sepl';
import billingProxyRoutes from './routes/billingProxy';
import hrRoutes from './routes/hr';
import lettersRoutes from './routes/letters';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '100mb';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

// Health check
app.get('/health', (_, res: Response) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/portal-notifications', portalNotificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/emd', emdRoutes);
app.use('/api/sepl', seplRoutes);
app.use('/api/billing', billingProxyRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/letters', lettersRoutes);

// Error handler
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    console.log('\n🚀 Starting Easy Reminder Backend...\n');

    // Initialize database
    await initializeDatabase();

    // Initialize funnel database
    await initializeFunnelDatabase();

    // Initialize email services
    initializeEmailService();
    initializeAzureEmailService();

    // Start scheduled jobs
    startExpiryCheckJob();
    startCleanupJob();

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`\n📋 Available endpoints:`);
      console.log('  POST   /api/auth/azure-callback  - Authenticate with Azure');
      console.log('  GET    /api/auth/me              - Get current user');
      console.log('  GET    /api/products             - List products');
      console.log('  GET    /api/products/:id         - Get product details');
      console.log('  POST   /api/products             - Create product');
      console.log('  PUT    /api/products/:id         - Update product');
      console.log('  DELETE /api/products/:id         - Delete product');
      console.log('  GET    /api/products/dashboard-stats - Get dashboard stats\n');
      console.log('  GET    /api/tasks                - List tasks');
      console.log('  GET    /api/tasks/:id            - Get task');
      console.log('  POST   /api/tasks                - Create task');
      console.log('  PUT    /api/tasks/:id            - Update task');
      console.log('  DELETE /api/tasks/:id            - Delete task');
      console.log('  GET    /api/tasks/notifications/all - List task notifications\n');
      console.log('  GET    /api/emd                  - List EMDs');
      console.log('  GET    /api/emd/:id              - Get EMD');
      console.log('  POST   /api/emd                  - Create EMD');
      console.log('  PUT    /api/emd/:id              - Update EMD');
      console.log('  DELETE /api/emd/:id              - Delete EMD');
      console.log('  GET    /api/emd/dashboard        - EMD Dashboard\n');
      console.log('  GET    /api/epbg                 - List ePBGs');
      console.log('  GET    /api/epbg/:id             - Get ePBG');
      console.log('  POST   /api/epbg                 - Create ePBG');
      console.log('  PUT    /api/epbg/:id             - Update ePBG');
      console.log('  DELETE /api/epbg/:id             - Delete ePBG');
      console.log('  GET    /api/epbg/dashboard       - ePBG Dashboard\n');
      console.log('  GET    /api/notifications        - List all notifications');
      console.log('  GET    /api/notifications/unseen - Get unseen count');
      console.log('  POST   /api/notifications/:id/read - Mark notification as read');
      console.log('  POST   /api/notifications/read-all - Mark all notifications as read\n');
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
