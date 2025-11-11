import express, { Router } from "express";
import { 
  createPaymentSession, 
  handlePaymentCallback 
} from "../../../controller/api/user/payment/payment.controller";
import { 
  authenticateOMT, 
  initiatePaymentOMT, 
  getPaymentStatusOMT 
} from "../../../controller/api/user/otm/otm.controller";

const otmPaymentRouter: Router = express.Router();

// ============================================
// SHOPIFY PAYMENT APP ROUTES (Main Flow)
// ============================================

/**
 * Shopify calls this when customer initiates checkout
 * This creates payment session and redirects to OMT
 * POST /api/otm/payments/session
 */
otmPaymentRouter.post('/session', createPaymentSession);

/**
 * OMT redirects customer here after payment completion
 * This verifies payment and updates Shopify
 * GET /api/otm/payments/callback
 */
otmPaymentRouter.get('/callback', handlePaymentCallback);

// ============================================
// OMT DIRECT API ROUTES (Testing/Manual Operations)
// ============================================

/**
 * Manually authenticate with OMT
 * POST /api/otm/authenticate
 */
otmPaymentRouter.post('/authenticate', authenticateOMT);

/**
 * Manually initiate payment with OMT
 * POST /api/otm/payments/initiate
 * Body: { amount, currency, identifier, transactionId }
 */
otmPaymentRouter.post('/payments/initiate', initiatePaymentOMT);

/**
 * Manually check payment status
 * POST /api/otm/payments/status
 * Body: { transactionId }
 */
otmPaymentRouter.post('/payments/status', getPaymentStatusOMT);

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Health check endpoint
 * GET /api/otm/health
 */
otmPaymentRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'OMT Payment Gateway',
    timestamp: new Date().toISOString()
  });
});

export default otmPaymentRouter;
