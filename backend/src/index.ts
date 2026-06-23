import express, { Express, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import multer from 'multer';
import { initializeFunnelDatabase } from './config/funnelDatabase';
import seplRoutes from './routes/sepl';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5010;
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '100mb';
const DEMO_BACKEND_URL = process.env.DEMO_BACKEND_URL || 'http://localhost:5001';

// Configure multer for file uploads (memory storage for BOQ files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://demo.surbhi.net', 'https://funneldemo.surbhi.net'],
  credentials: true,
}));
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

// Health check
app.get('/health', (_, res: Response) => {
  res.json({ status: 'ok', service: 'funnel-service', mode: 'standalone' });
});

// Routes
app.use('/api/sepl', (req, res, next) => {
  // Use multer for BOQ upload endpoint only
  if (req.path.endsWith('/boq') && req.method === 'POST') {
    upload.single('file')(req, res, next);
  } else {
    next();
  }
}, seplRoutes);

// Proxy admin and users routes to main demo-backend
app.use('/api/admin', createProxyMiddleware({ target: DEMO_BACKEND_URL, changeOrigin: true, pathRewrite: (path) => '/api/admin' + path }));
app.use('/api/users', createProxyMiddleware({ target: DEMO_BACKEND_URL, changeOrigin: true, pathRewrite: (path) => '/api/users' + path }));

// Initialize and start server
async function startServer() {
  try {
    console.log('\n🚀 Starting Funnel Backend (Standalone)...\n');

    // Initialize funnel database
    await initializeFunnelDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Funnel backend running on http://localhost:${PORT}`);
      console.log(`\n📋 Available endpoints:`);
      console.log('  GET    /health               - Health check');
      console.log('  GET    /api/sepl             - List SEPL opportunities');
      console.log('  GET    /api/sepl/:id         - Get SEPL opportunity');
      console.log('  POST   /api/sepl             - Create SEPL opportunity');
      console.log('  PUT    /api/sepl/:id         - Update SEPL opportunity');
      console.log('  DELETE /api/sepl/:id         - Delete SEPL opportunity\n');
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
