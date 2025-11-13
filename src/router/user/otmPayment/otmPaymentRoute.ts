import express, { Router } from "express";
import { 
  createPaymentSession, 
  handlePaymentCallback,
  handleRefundSession,      
  handleCaptureSession,    
  handleVoidSession        
} from "../../../controller/api/user/payment/payment.controller";
import { 
  authenticateOMT, 
  initiatePaymentOMT, 
  getPaymentStatusOMT 
} from "../../../controller/api/user/otm/otm.controller";
import axios from "axios";

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

otmPaymentRouter.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing shop or code parameter");
  }

  try {
    // Exchange code for access token
    const response = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const accessToken = response.data.access_token;
    const scope = response.data.scope;

    // 🚩🚩🚩 PRINT THE CREDENTIALS 🚩🚩🚩
    console.log("=== SHOPIFY OAUTH CREDENTIALS RECEIVED ===");
    console.log("Shop  :", shop);
    console.log("Token :", accessToken);
    console.log("Scope :", scope);
    console.log("==========================================");

    res.send("Access token has been printed in the server logs. You can now copy it.");
  } catch (error: any) {
    console.error("❌ Failed to get Shopify access token", error.response?.data || error.message);
    res.status(500).send("Failed to get access token from Shopify");
  }
});

otmPaymentRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'OMT Payment Gateway',
    timestamp: new Date().toISOString()
  });
});

export default otmPaymentRouter;
