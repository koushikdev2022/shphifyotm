import { Request, Response } from 'express';
import axios from 'axios';
import { PaymentService } from '../../../../service/user/otm/payment/payment.service';
import { PaymentStatus } from '../../../../entities';

const paymentService = new PaymentService();

const OMT_BASE_URL = 'https://pay-test.omt.com.lb/onlinepayment/api';
const OMT_USERNAME = "nicolas.kadri@tedmob.com";
const OMT_PASSWORD = "<Fr-i0t+Hrw7`eeRN,W8w";

// In-memory token storage (replace with Redis/DB in production)
let accessToken = '';
let refreshToken = '';

// ============================================
// TYPE GUARD HELPER
// ============================================

/**
 * Type guard to check if payment has valid OMT transaction ID
 */
function hasOMTTransaction(payment: any): payment is { omtTransactionId: string } {
  return payment.omtTransactionId !== null && payment.omtTransactionId !== undefined;
}

// ============================================
// INTERNAL OMT FUNCTIONS
// ============================================

/**
 * Authenticate with OMT to get access token (Internal function)
 */
async function authenticateOMT() {
  try {
    const response = await axios.post(`${OMT_BASE_URL}/authenticate-user`, {
      username: OMT_USERNAME,
      password: OMT_PASSWORD,
    });

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;

    console.log('✅ OMT Authentication successful');
    return accessToken;
  } catch (error: any) {
    console.error('❌ OMT Authentication error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with OMT portal');
  }
}

/**
 * Initiate payment via OMT (Internal function)
 */
async function initiateOMTPayment(data: {
  amount: number;
  currency: string;
  identifier: string;
  transactionId: string;
}) {
  try {
    if (!accessToken) {
      await authenticateOMT();
    }

    const payload = {
      username: OMT_USERNAME,
      amount: data.amount,
      currency: data.currency,
      identifier: data.identifier,
      transaction_id: data.transactionId,
    };

    const response = await axios.post(`${OMT_BASE_URL}/initiate-payment`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('✅ OMT Payment initiated:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, refreshing...');
      await authenticateOMT();
      return initiateOMTPayment(data);
    }

    console.error('❌ OMT Payment initiation error:', error.response?.data || error.message);
    throw new Error('Failed to initiate payment');
  }
}

/**
 * Get payment status from OMT (Internal function)
 */
async function getOMTPaymentStatus(transactionId: string) {
  try {
    if (!accessToken) {
      await authenticateOMT();
    }

    const payload = {
      username: OMT_USERNAME,
      transaction_id: transactionId,
    };

    const response = await axios.post(`${OMT_BASE_URL}/payment-status`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('✅ OMT Payment status retrieved:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, refreshing...');
      await authenticateOMT();
      return getOMTPaymentStatus(transactionId);
    }

    console.error('❌ OMT Payment status error:', error.response?.data || error.message);
    throw new Error('Failed to get payment status');
  }
}

/**
 * Process refund via OMT (Internal function)
 */
async function initiateOMTRefund(data: {
  transactionId: string;
  amount: number;
  currency: string;
}) {
  try {
    if (!accessToken) {
      await authenticateOMT();
    }

    const payload = {
      username: OMT_USERNAME,
      transaction_id: data.transactionId,
      amount: data.amount,
      currency: data.currency,
    };

    const response = await axios.post(`${OMT_BASE_URL}/refund-payment`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('✅ OMT Refund initiated:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, refreshing...');
      await authenticateOMT();
      return initiateOMTRefund(data);
    }

    console.error('❌ OMT Refund error:', error.response?.data || error.message);
    throw new Error('Failed to process refund');
  }
}

/**
 * Capture payment via OMT (Internal function)
 */
async function captureOMTPayment(transactionId: string, amount: number) {
  try {
    if (!accessToken) {
      await authenticateOMT();
    }

    const payload = {
      username: OMT_USERNAME,
      transaction_id: transactionId,
      amount: amount,
    };

    const response = await axios.post(`${OMT_BASE_URL}/capture-payment`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('✅ OMT Payment captured:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, refreshing...');
      await authenticateOMT();
      return captureOMTPayment(transactionId, amount);
    }

    console.error('❌ OMT Capture error:', error.response?.data || error.message);
    throw new Error('Failed to capture payment');
  }
}

/**
 * Void payment via OMT (Internal function)
 */
async function voidOMTPayment(transactionId: string) {
  try {
    if (!accessToken) {
      await authenticateOMT();
    }

    const payload = {
      username: OMT_USERNAME,
      transaction_id: transactionId,
    };

    const response = await axios.post(`${OMT_BASE_URL}/void-payment`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('✅ OMT Payment voided:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, refreshing...');
      await authenticateOMT();
      return voidOMTPayment(transactionId);
    }

    console.error('❌ OMT Void error:', error.response?.data || error.message);
    throw new Error('Failed to void payment');
  }
}

// ============================================
// SHOPIFY API FUNCTIONS
// ============================================

/**
 * Resolve payment in Shopify (mark as successful)
 */
async function resolveShopifyPayment(
  shop: string,
  shopifyAccessToken: string,
  sessionId: string
) {
  const mutation = `
    mutation PaymentSessionResolve($id: ID!) {
      paymentSessionResolve(id: $id) {
        paymentSession {
          id
          state {
            ... on PaymentSessionStateResolved {
              code
            }
          }
          nextAction {
            action
            context {
              ... on PaymentSessionActionsRedirect {
                redirectUrl
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      `https://${shop}/payments_apps/api/2025-10/graphql.json`,
      {
        query: mutation,
        variables: { id: sessionId },
      },
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors || response.data.data?.paymentSessionResolve?.userErrors?.length > 0) {
      console.error('Shopify resolve errors:', response.data);
      throw new Error('Failed to resolve payment in Shopify');
    }

    console.log('✅ Payment resolved in Shopify:', sessionId);
    return response.data.data.paymentSessionResolve.paymentSession.nextAction?.context?.redirectUrl;
  } catch (error: any) {
    console.error('❌ Failed to resolve Shopify payment:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Reject payment in Shopify (mark as failed)
 */
async function rejectShopifyPayment(
  shop: string,
  shopifyAccessToken: string,
  sessionId: string,
  reason: string
) {
  const mutation = `
    mutation PaymentSessionReject($id: ID!, $reason: PaymentSessionRejectionReasonInput!) {
      paymentSessionReject(id: $id, reason: $reason) {
        paymentSession {
          id
          state {
            ... on PaymentSessionStateRejected {
              code
              reason
            }
          }
          nextAction {
            action
            context {
              ... on PaymentSessionActionsRedirect {
                redirectUrl
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      `https://${shop}/payments_apps/api/2025-10/graphql.json`,
      {
        query: mutation,
        variables: {
          id: sessionId,
          reason: {
            code: 'PROCESSING_ERROR',
            merchantMessage: reason,
          },
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors || response.data.data?.paymentSessionReject?.userErrors?.length > 0) {
      console.error('Shopify reject errors:', response.data);
      throw new Error('Failed to reject payment in Shopify');
    }

    console.log('✅ Payment rejected in Shopify:', sessionId);
    return response.data.data.paymentSessionReject.paymentSession.nextAction?.context?.redirectUrl;
  } catch (error: any) {
    console.error('❌ Failed to reject Shopify payment:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Resolve refund in Shopify
 */
async function resolveShopifyRefund(
  shop: string,
  shopifyAccessToken: string,
  refundSessionId: string
) {
  const mutation = `
    mutation RefundSessionResolve($id: ID!) {
      refundSessionResolve(id: $id) {
        refundSession {
          id
          state {
            ... on RefundSessionStateResolved {
              code
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      `https://${shop}/payments_apps/api/2025-10/graphql.json`,
      {
        query: mutation,
        variables: { id: refundSessionId },
      },
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors || response.data.data?.refundSessionResolve?.userErrors?.length > 0) {
      console.error('Shopify refund resolve errors:', response.data);
      throw new Error('Failed to resolve refund in Shopify');
    }

    console.log('✅ Refund resolved in Shopify:', refundSessionId);
  } catch (error: any) {
    console.error('❌ Failed to resolve Shopify refund:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Reject refund in Shopify
 */
async function rejectShopifyRefund(
  shop: string,
  shopifyAccessToken: string,
  refundSessionId: string,
  reason: string
) {
  const mutation = `
    mutation RefundSessionReject($id: ID!, $reason: RefundSessionRejectionReasonInput!) {
      refundSessionReject(id: $id, reason: $reason) {
        refundSession {
          id
          state {
            ... on RefundSessionStateRejected {
              code
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      `https://${shop}/payments_apps/api/2025-10/graphql.json`,
      {
        query: mutation,
        variables: {
          id: refundSessionId,
          reason: {
            code: 'PROCESSING_ERROR',
            merchantMessage: reason,
          },
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors || response.data.data?.refundSessionReject?.userErrors?.length > 0) {
      console.error('Shopify refund reject errors:', response.data);
      throw new Error('Failed to reject refund in Shopify');
    }

    console.log('✅ Refund rejected in Shopify:', refundSessionId);
  } catch (error: any) {
    console.error('❌ Failed to reject Shopify refund:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// EXPORTED CONTROLLER FUNCTIONS
// ============================================

/**
 * Create payment session (called by Shopify)
 * POST /api/otm/session
 */
export const createPaymentSession = async (req: Request, res: Response) => {
  try {
    const { id, gid, amount, currency, test, merchant_locale, customer, payment_method } = req.body;

    console.log('📝 Creating payment session:', {
      sessionId: id,
      gid: gid,
      shop: merchant_locale?.shop_id,
      amount,
      currency,
      test,
      paymentMethod: payment_method?.type
    });

    // Validate required fields
    if (!id || !amount || !currency || !merchant_locale?.shop_id) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Create payment session in database
    const session = await paymentService.createPaymentSession({
      shop: merchant_locale.shop_id,
      shopifySessionId: id,
      amount: parseFloat(amount),
      currency: currency,
      customerEmail: customer?.email,
      test: test || false,
    });

    console.log('💾 Payment session saved to DB:', session.id);

    // 2. Initiate payment with OMT (skip for test transactions)
    let omtPayment;
    if (test) {
      // Mock response for test transactions
      omtPayment = {
        transaction_id: `test-omt-${id}`,
        payment_url: `https://shopifytsapi.bestworks.cloud/api/otm/callback?transaction_id=test-omt-${id}&status=success`
      };
      console.log('🧪 Using mock OMT payment for test transaction');
    } else {
      // Real OMT payment for production
      omtPayment = await initiateOMTPayment({
        amount: parseFloat(amount),
        currency: currency,
        identifier: merchant_locale.shop_id,
        transactionId: id,
      });
    }

    // 3. Update session with OMT details
    await paymentService.updateWithOMTTransaction(
      session.shopifySessionId,
      omtPayment.transaction_id,
      omtPayment.payment_url
    );

    console.log('✅ Payment session created successfully');

    // 4. Return redirect URL to Shopify (REQUIRED!)
    return res.status(200).json({
      redirect_url: omtPayment.payment_url,
    });

  } catch (error: any) {
    console.error('❌ Payment session error:', error);
    return res.status(500).json({
      error: 'Failed to create payment session',
      message: error.message,
    });
  }
};

/**
 * Handle payment callback from OMT
 * GET /api/otm/callback
 */
export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    const { transaction_id, status } = req.query;

    console.log('🔔 Payment callback received:', {
      transactionId: transaction_id,
      status,
    });

    if (!transaction_id) {
      return res.status(400).json({ error: 'Missing transaction_id' });
    }

    // 1. Get payment session from database
    const session = await paymentService.getByOMTTransactionId(
      transaction_id as string
    );

    if (!session) {
      console.error('❌ Payment session not found:', transaction_id);
      return res.status(404).json({ error: 'Payment session not found' });
    }

    console.log('💾 Payment session found:', {
      id: session.id,
      shop: session.shop,
      amount: session.amount,
    });

    // 2. Verify payment status
    let paymentStatus: PaymentStatus;
    let errorMessage: string | null = null;

    // Check if this is a test transaction
    if ((transaction_id as string).startsWith('test-omt-')) {
      // Mock test transaction - use query parameter status
      paymentStatus = status === 'success' ? 'completed' : 'failed';
      console.log('🧪 Test transaction detected, using mock status:', paymentStatus);
    } else {
      // Real transaction - verify with OMT
      const omtStatus = await getOMTPaymentStatus(transaction_id as string);
      paymentStatus = omtStatus.status === 'success' ? 'completed' : 'failed';
      errorMessage = omtStatus.error_message || null;
    }

    // 3. Update status in database
    await paymentService.updatePaymentStatus(
      transaction_id as string,
      paymentStatus,
      errorMessage
    );

    console.log(`💾 Payment status updated to: ${paymentStatus}`);

    // 4. Get shop credentials
    const shopCreds = await paymentService.getShopCredentials(session.shop);
    console.log(shopCreds,"shopCreds")

    if (!shopCreds) {
      console.error('❌ Shop credentials not found for:', session.shop);
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 5. Resolve or reject payment in Shopify
    let redirectUrl: string | undefined;
    
    if (paymentStatus === 'completed') {
      redirectUrl = await resolveShopifyPayment(
        session.shop,
        shopCreds.accessToken,
        session.shopifySessionId
      );
    } else {
      redirectUrl = await rejectShopifyPayment(
        session.shop,
        shopCreds.accessToken,
        session.shopifySessionId,
        errorMessage || 'Payment failed'
      );
    }

    // 6. Redirect customer back to Shopify
    const finalRedirectUrl = redirectUrl || `https://${session.shop}`;
    console.log('🔄 Redirecting customer to:', finalRedirectUrl);
    
    return res.redirect(finalRedirectUrl);

  } catch (error: any) {
    console.error('❌ Payment callback error:', error);
    return res.status(500).json({
      error: 'Failed to process callback',
      message: error.message,
    });
  }
};

/**
 * Handle refund request from Shopify
 * POST /api/otm/refunds/session
 */
export const handleRefundSession = async (req: Request, res: Response) => {
  try {
    const { id, gid, payment_id, amount, currency, proposed_at } = req.body;

    console.log('💰 Refund request received:', {
      refundSessionId: id,
      paymentId: payment_id,
      amount,
      currency,
      proposedAt: proposed_at
    });

    // Validate required fields
    if (!id || !payment_id || !amount || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Get original payment from database
    const payment = await paymentService.getByShopifySessionId(payment_id);
    
    if (!payment) {
      console.error('❌ Payment not found:', payment_id);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // ✅ Check if payment has OMT transaction ID
    if (!hasOMTTransaction(payment)) {
      console.error('❌ Payment has no OMT transaction ID:', payment_id);
      return res.status(400).json({ error: 'Payment not processed with OMT' });
    }

    console.log('💾 Original payment found:', {
      omtTransactionId: payment.omtTransactionId,
      originalAmount: payment.amount
    });

    // 2. Process refund with OMT or mock for test
    let omtRefund;
    if (payment.omtTransactionId.startsWith('test-omt-')) {
      // Mock refund for test transactions
      omtRefund = {
        refund_id: `test-refund-${id}`,
        status: 'success',
        error_message: null
      };
      console.log('🧪 Using mock refund for test transaction');
    } else {
      // Real refund
      omtRefund = await initiateOMTRefund({
        transactionId: payment.omtTransactionId,
        amount: parseFloat(amount),
        currency: currency
      });
    }

    // 3. Save refund to database
    await paymentService.createRefund({
      shopifyRefundId: id,
      paymentId: payment.id,
      omtRefundId: omtRefund.refund_id || null,
      amount: parseFloat(amount),
      currency: currency,
      status: omtRefund.status === 'success' ? 'completed' : 'failed'
    });

    // 4. Get shop credentials
    const shopCreds = await paymentService.getShopCredentials(payment.shop);

    if (!shopCreds) {
      console.error('❌ Shop credentials not found');
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 5. Resolve or reject refund in Shopify
    if (omtRefund.status === 'success') {
      await resolveShopifyRefund(
        payment.shop,
        shopCreds.accessToken,
        id
      );
      console.log('✅ Refund completed successfully');
      return res.status(200).json({ message: 'Refund processed successfully' });
    } else {
      await rejectShopifyRefund(
        payment.shop,
        shopCreds.accessToken,
        id,
        omtRefund.error_message || 'Refund failed'
      );
      console.log('❌ Refund failed');
      return res.status(500).json({ error: 'Refund failed' });
    }

  } catch (error: any) {
    console.error('❌ Refund error:', error);
    return res.status(500).json({
      error: 'Failed to process refund',
      message: error.message
    });
  }
};

/**
 * Handle capture request from Shopify
 * POST /api/otm/capture/session
 */
export const handleCaptureSession = async (req: Request, res: Response) => {
  try {
    const { id, gid, payment_id, amount, currency } = req.body;

    console.log('🎯 Capture request received:', {
      captureSessionId: id,
      paymentId: payment_id,
      amount,
      currency
    });

    // Validate required fields
    if (!id || !payment_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Get payment from database
    const payment = await paymentService.getByShopifySessionId(payment_id);
    
    if (!payment) {
      console.error('❌ Payment not found:', payment_id);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // ✅ Check if payment has OMT transaction ID
    if (!hasOMTTransaction(payment)) {
      console.error('❌ Payment has no OMT transaction ID:', payment_id);
      return res.status(400).json({ error: 'Payment not processed with OMT' });
    }

    // 2. Capture payment with OMT or mock for test
    if (payment.omtTransactionId.startsWith('test-omt-')) {
      console.log('🧪 Using mock capture for test transaction');
    } else {
      await captureOMTPayment(
        payment.omtTransactionId,
        parseFloat(amount)
      );
    }

    // 3. Update payment status in database
    await paymentService.updatePaymentStatus(
      payment.omtTransactionId,
      'captured',
      null
    );

    // 4. Get shop credentials
    const shopCreds = await paymentService.getShopCredentials(payment.shop);

    if (!shopCreds) {
      console.error('❌ Shop credentials not found');
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 5. Resolve capture in Shopify
    await resolveShopifyPayment(
      payment.shop,
      shopCreds.accessToken,
      id
    );

    console.log('✅ Capture completed successfully');
    return res.status(200).json({ message: 'Capture successful' });

  } catch (error: any) {
    console.error('❌ Capture error:', error);
    return res.status(500).json({
      error: 'Failed to capture payment',
      message: error.message
    });
  }
};

/**
 * Handle void request from Shopify
 * POST /api/otm/void/session
 */
export const handleVoidSession = async (req: Request, res: Response) => {
  try {
    const { id, gid, payment_id } = req.body;

    console.log('🚫 Void request received:', {
      voidSessionId: id,
      paymentId: payment_id
    });

    // Validate required fields
    if (!id || !payment_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Get payment from database
    const payment = await paymentService.getByShopifySessionId(payment_id);
    
    if (!payment) {
      console.error('❌ Payment not found:', payment_id);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // ✅ Check if payment has OMT transaction ID
    if (!hasOMTTransaction(payment)) {
      console.error('❌ Payment has no OMT transaction ID:', payment_id);
      return res.status(400).json({ error: 'Payment not processed with OMT' });
    }

    // 2. Void payment with OMT or mock for test
    if (payment.omtTransactionId.startsWith('test-omt-')) {
      console.log('🧪 Using mock void for test transaction');
    } else {
      await voidOMTPayment(payment.omtTransactionId);
    }

    // 3. Update payment status in database
    await paymentService.updatePaymentStatus(
      payment.omtTransactionId,
      'voided',
      null
    );

    // 4. Get shop credentials
    const shopCreds = await paymentService.getShopCredentials(payment.shop);

    if (!shopCreds) {
      console.error('❌ Shop credentials not found');
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 5. Resolve void in Shopify
    await resolveShopifyPayment(
      payment.shop,
      shopCreds.accessToken,
      id
    );

    console.log('✅ Void completed successfully');
    return res.status(200).json({ message: 'Payment voided successfully' });

  } catch (error: any) {
    console.error('❌ Void error:', error);
    return res.status(500).json({
      error: 'Failed to void payment',
      message: error.message
    });
  }
};
