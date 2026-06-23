import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  moveStage,
  deleteOpportunity,
  getDashboard,
  getOwnerStats,
  exportOpportunities,
  listOEMs,
  createOEM,
  updateOEM,
  deleteOEM,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listOICs,
  createOIC,
  updateOIC,
  deleteOIC,
  bulkUploadOpportunities,
  uploadBOQ
} from '../controllers/sepl';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/owner-stats', getOwnerStats);

// Export
router.get('/export', exportOpportunities);

// OEM Management
router.get('/oems', listOEMs);
router.post('/oems', createOEM);
router.put('/oems/:id', updateOEM);
router.delete('/oems/:id', deleteOEM);

// Product Management
router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Customer Management
router.get('/customers', listCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// OIC Management
router.get('/oics', listOICs);
router.post('/oics', createOIC);
router.put('/oics/:id', updateOIC);
router.delete('/oics/:id', deleteOIC);

// CRUD operations for opportunities
router.get('/', listOpportunities);
router.get('/:id', getOpportunity);
router.post('/', createOpportunity);
router.post('/bulk-upload', bulkUploadOpportunities);
router.put('/:id', updateOpportunity);
router.delete('/:id', deleteOpportunity);

// Stage movement
router.post('/:id/move', moveStage);

// BOQ Upload
router.post('/:id/boq', uploadBOQ);

export default router;
