import { Request, Response } from 'express';
import axios from 'axios';
import { PaymentService } from '../../../../service/user/otm/payment/payment.service';

const paymentService = new PaymentService();

const OMT_BASE_URL = process.env.OMT_BASE_URL || 'https://pay-test.omt.com.lb/onlinepayment/api';
const OMT_USERNAME = process.env.OMT_USERNAME!;
const OMT_PASSWORD = process.env.OMT_PASSWORD!;

// In-memory token storage (replace with Redis/DB in production)
let accessToken = '';
let refreshToken = '';

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
    // Ensure we have a valid token
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
    // If token expired, retry with fresh token
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, refreshing...');
      await authenticateOMT();
      return initiateOMTPayment(data); // Retry once
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
      return getOMTPaymentStatus(transactionId); // Retry once
    }

    console.error('❌ OMT Payment status error:', error.response?.data || error.message);
    throw new Error('Failed to get payment status');
  }
}

/**
 * Resolve payment in Shopify (mark as successful)
 */
async function resolveShopifyPayment(
  shop: string,
  accessToken: string,
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
      `https://${shop}/admin/api/2025-01/graphql.json`,
      {
        query: mutation,
        variables: { id: sessionId },
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors || response.data.data?.paymentSessionResolve?.userErrors?.length > 0) {
      console.error('Shopify resolve errors:', response.data);
      throw new Error('Failed to resolve payment in Shopify');
    }

    console.log('✅ Payment resolved in Shopify:', sessionId);
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
  accessToken: string,
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
      `https://${shop}/admin/api/2025-01/graphql.json`,
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
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors || response.data.data?.paymentSessionReject?.userErrors?.length > 0) {
      console.error('Shopify reject errors:', response.data);
      throw new Error('Failed to reject payment in Shopify');
    }

    console.log('✅ Payment rejected in Shopify:', sessionId);
  } catch (error: any) {
    console.error('❌ Failed to reject Shopify payment:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// EXPORTED CONTROLLER FUNCTIONS
// ============================================

/**
 * Create payment session (called by Shopify)
 * POST /api/payments/session
 */
export const createPaymentSession = async (req: Request, res: Response) => {
  try {
    const { id, amount, currency, merchant_locale, customer } = req.body;

    console.log('📝 Creating payment session:', {
      sessionId: id,
      shop: merchant_locale?.shop_id,
      amount,
      currency,
    });

    // 1. Create payment session in database
    const session = await paymentService.createPaymentSession({
      shop: merchant_locale.shop_id,
      shopifySessionId: id,
      amount: parseFloat(amount),
      currency: currency,
      customerEmail: customer?.email,
    });

    console.log('💾 Payment session saved to DB:', session.id);

    // 2. Initiate payment with OMT
    const omtPayment = await initiateOMTPayment({
      amount: parseFloat(amount),
      currency: currency,
      identifier: merchant_locale.shop_id,
      transactionId: id,
    });

    // 3. Update session with OMT details
    await paymentService.updateWithOMTTransaction(
      session.shopifySessionId,
      omtPayment.transaction_id,
      omtPayment.payment_url
    );

    console.log('✅ Payment session created successfully');

    // 4. Return redirect URL to Shopify
    res.json({
      redirect_url: omtPayment.payment_url,
    });
  } catch (error: any) {
    console.error('❌ Payment session error:', error);
    res.status(500).json({
      error: 'Failed to create payment session',
      message: error.message,
    });
  }
};

/**
 * Handle payment callback from OMT
 * GET /api/payments/callback
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

    // 2. Verify with OMT
    const omtStatus = await getOMTPaymentStatus(transaction_id as string);

    // 3. Update status in database
    const paymentStatus = omtStatus.status === 'success' ? 'completed' : 'failed';
    await paymentService.updatePaymentStatus(
      transaction_id as string,
      paymentStatus,
      omtStatus.error_message
    );

    console.log(`💾 Payment status updated to: ${paymentStatus}`);

    // 4. Get shop credentials
    const shopCreds = await paymentService.getShopCredentials(session.shop);

    if (!shopCreds) {
      console.error('❌ Shop credentials not found for:', session.shop);
      return res.status(404).json({ error: 'Shop not found' });
    }

    // 5. Resolve or reject payment in Shopify
    if (paymentStatus === 'completed') {
      await resolveShopifyPayment(
        session.shop,
        shopCreds.accessToken,
        session.shopifySessionId
      );
    } else {
      await rejectShopifyPayment(
        session.shop,
        shopCreds.accessToken,
        session.shopifySessionId,
        omtStatus.error_message || 'Payment failed'
      );
    }

    // 6. Redirect customer back to Shopify
    const redirectUrl = session.shopifyRedirectUrl || `https://${session.shop}`;
    console.log('🔄 Redirecting customer to:', redirectUrl);
    
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('❌ Payment callback error:', error);
    res.status(500).json({
      error: 'Failed to process callback',
      message: error.message,
    });
  }
};
