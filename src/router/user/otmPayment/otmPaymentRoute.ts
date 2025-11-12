import express, { Router } from "express";
import { 
  createPaymentSession, 
  handlePaymentCallback,
  handleRefundSession,      // ✅ Add these
  handleCaptureSession,     // ✅ Add these
  handleVoidSession         // ✅ Add these
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
 * POST /api/otm/session
 */
otmPaymentRouter.post('/session', createPaymentSession);

/**
 * OMT redirects customer here after payment completion
 * GET /api/otm/callback
 */
otmPaymentRouter.get('/callback', handlePaymentCallback);

/**
 * Shopify calls this to refund a payment
 * POST /api/otm/refunds/session
 */
otmPaymentRouter.post('/refunds/session', handleRefundSession);

/**
 * Shopify calls this to capture an authorized payment
 * POST /api/otm/capture/session
 */
otmPaymentRouter.post('/capture/session', handleCaptureSession);

/**
 * Shopify calls this to void an authorized payment
 * POST /api/otm/void/session
 */
otmPaymentRouter.post('/void/session', handleVoidSession);

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
 */
otmPaymentRouter.post('/payments/initiate', initiatePaymentOMT);

/**
 * Manually check payment status
 * POST /api/otm/payments/status
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
