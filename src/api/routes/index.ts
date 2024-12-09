import { Router } from 'express';
import tokenRoutes from './tokenRoutes';
import transactionRoutes from './transactionRoutes';
import adminRoutes from './adminRoutes';
import { AuthMiddleware } from '../../middleware/auth';

const router = Router();
const authMiddleware = new AuthMiddleware();

// Health check endpoint
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Protected API routes
router.use('/api/tokens', authMiddleware.authenticate(), tokenRoutes);
router.use('/api/transactions', authMiddleware.authenticate(), transactionRoutes);
router.use('/api/admin', authMiddleware.authenticate(['admin']), adminRoutes);

export default router;