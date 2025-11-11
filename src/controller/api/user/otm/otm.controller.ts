import { Request, Response } from 'express';
import axios from 'axios';

const OMT_BASE_URL = 'https://pay-test.omt.com.lb/onlinepayment/api';

// Load these from environment variables for security:
const OMT_USERNAME = process.env.OMT_USERNAME!; // e.g., "nicolas.kadri@tedmob.com"
const OMT_PASSWORD = process.env.OMT_PASSWORD!;

// In-memory token storage — replace with DB in production
let accessToken = '';
let refreshToken = '';

/**
 * Authenticate with OMT to get access token
 * POST /api/omt/authenticate
 */
export const authenticateOMT = async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${OMT_BASE_URL}/authenticate-user`, {
      username: OMT_USERNAME,
      password: OMT_PASSWORD,
    });

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('OMT Authentication error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authenticate with OMT portal' });
  }
};

/**
 * Refresh OMT access token
 * POST /api/omt/refresh-token
 */
export const refreshTokenOMT = async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${OMT_BASE_URL}/refresh-token`, {
      refresh_token: refreshToken,
      access_token: accessToken,
    });

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('OMT Token refresh error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

/**
 * Initiate payment via OMT
 * POST /api/omt/payments/initiate
 */
export const initiatePaymentOMT = async (req: Request, res: Response) => {
  try {
    const { amount, currency, identifier, transactionId } = req.body;

    if (!amount || !currency || !identifier || !transactionId) {
      return res.status(400).json({ error: 'Missing required payment parameters' });
    }

    const payload = {
      username: OMT_USERNAME,
      amount,
      currency,
      identifier,
      transaction_id: transactionId,
    };

    const response = await axios.post(`${OMT_BASE_URL}/initiate-payment`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('OMT Payment initiation error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

/**
 * Get payment status from OMT
 * POST /api/omt/payments/status
 */
export const getPaymentStatusOMT = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Missing transaction_id' });
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

    res.json(response.data);
  } catch (error: any) {
    console.error('OMT Payment status error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
};
