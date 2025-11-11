// shopify.controller.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!;
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES!;
const HOST = process.env.HOST!;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION!;

// In-memory store (replace with database in production)
const shopSessions: Record<string, { accessToken: string; shop: string }> = {};

// ============================================
// 1. INITIATE SHOPIFY APP INSTALLATION
// ============================================

/**
 * Start Shopify OAuth installation flow
 * Route: GET /api/shopify/install?shop=store-name.myshopify.com
 */
export const initiateInstallation = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as string;

    if (!shop) {
      return res.status(400).json({ 
        error: 'Missing shop parameter. Use ?shop=your-store.myshopify.com' 
      });
    }

    // Validate shop domain format
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain format' });
    }
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${HOST}/api/shopify/auth/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_API_KEY}&` +
      `scope=${SHOPIFY_SCOPES}&` +
      `state=${state}&` +
      `redirect_uri=${redirectUri}`;

    console.log(`🔐 Redirecting to Shopify OAuth for shop: ${shop}`);

    res.redirect(installUrl);
  } catch (error) {
    console.error('Installation initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate installation' });
  }
};

// ============================================
// 2. HANDLE OAUTH CALLBACK FROM SHOPIFY
// ============================================

/**
 * Handle OAuth callback and exchange code for access token
 * Route: GET /api/shopify/auth/callback
 */
export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { shop, hmac, code, state } = req.query;

    if (!shop || !hmac || !code) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // ============================================
    // SECURITY: VERIFY HMAC SIGNATURE
    // ============================================
    const queryParams = { ...req.query };
    delete queryParams.hmac;

    // Sort and serialize parameters
    const message = Object.keys(queryParams)
      .sort()
      .map(key => `${key}=${queryParams[key]}`)
      .join('&');

    // Generate HMAC hash
    const generatedHash = crypto
      .createHmac('sha256', SHOPIFY_API_SECRET)
      .update(message)
      .digest('hex');

    // Compare HMACs (timing-safe comparison)
    const providedHmac = Buffer.from(hmac as string, 'utf-8');
    const generatedHmacBuffer = Buffer.from(generatedHash, 'utf-8');

    if (
      generatedHmacBuffer.length !== providedHmac.length ||
      !crypto.timingSafeEqual(generatedHmacBuffer, providedHmac)
    ) {
      return res.status(403).json({ error: 'HMAC validation failed' });
    }

    console.log('✅ HMAC validation passed');

    // ============================================
    // EXCHANGE CODE FOR ACCESS TOKEN
    // ============================================
    const accessTokenUrl = `https://${shop}/admin/oauth/access_token`;
    const accessTokenPayload = {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    };

    const tokenResponse = await axios.post(accessTokenUrl, accessTokenPayload);
    const accessToken = tokenResponse.data.access_token;
    const scope = tokenResponse.data.scope;

    console.log(`✅ Access token obtained for shop: ${shop}`);

    // ============================================
    // STORE ACCESS TOKEN IN DATABASE
    // ============================================
    shopSessions[shop as string] = {
      accessToken,
      shop: shop as string
    };

    // Save to database (implement this)
    await saveShopToDatabase({
      shop: shop as string,
      accessToken,
      scope,
      installedAt: new Date()
    });

    // ============================================
    // REGISTER WEBHOOKS
    // ============================================
    await registerWebhooks(shop as string, accessToken);

    // Redirect merchant to success page or back to Shopify admin
    res.redirect(`https://${shop}/admin/apps`);

  } catch (error: any) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
};

// ============================================
// 3. GET SHOP INFORMATION
// ============================================

/**
 * Get shop details from Shopify
 * Route: GET /api/shopify/shop/info?shop=store-name.myshopify.com
 */
export const getShopInfo = async (req: Request, res: Response) => {
  try {
    const shop = req.query.shop as string;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get access token from storage
    const session = shopSessions[shop];
    if (!session) {
      return res.status(401).json({ error: 'Shop not authenticated' });
    }

    // Call Shopify Admin API
    const shopInfoUrl = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/shop.json`;
    const response = await axios.get(shopInfoUrl, {
      headers: {
        'X-Shopify-Access-Token': session.accessToken
      }
    });

    res.json(response.data.shop);
  } catch (error: any) {
    console.error('Get shop info error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch shop information' });
  }
};

// ============================================
// 4. HANDLE APP UNINSTALL WEBHOOK
// ============================================

/**
 * Handle app/uninstalled webhook from Shopify
 * Route: POST /api/shopify/webhooks/app-uninstalled
 */
export const uninstallApp = async (req: Request, res: Response) => {
  try {
    // Verify webhook authenticity
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const body = req.body;

    const generatedHash = crypto
      .createHmac('sha256', SHOPIFY_API_SECRET)
      .update(body, 'utf8')
      .digest('base64');

    if (generatedHash !== hmac) {
      return res.status(401).json({ error: 'Webhook verification failed' });
    }

    const webhookData = JSON.parse(body.toString());
    const shop = webhookData.domain;

    console.log(`🗑️ App uninstalled from shop: ${shop}`);

    // Remove shop data from database
    await removeShopFromDatabase(shop);
    delete shopSessions[shop];

    res.status(200).send('OK');
  } catch (error) {
    console.error('Uninstall webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Register required webhooks with Shopify
 */
async function registerWebhooks(shop: string, accessToken: string) {
  const webhooks = [
    {
      topic: 'app/uninstalled',
      address: `${HOST}/api/shopify/webhooks/app-uninstalled`,
      format: 'json'
    }
  ];

  for (const webhook of webhooks) {
    try {
      await axios.post(
        `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
        { webhook },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Registered webhook: ${webhook.topic}`);
    } catch (error: any) {
      console.error(`Failed to register webhook ${webhook.topic}:`, error.response?.data);
    }
  }
}

/**
 * Save shop session to database (implement with your DB)
 */
async function saveShopToDatabase(data: any) {
  // TODO: Implement database storage
  console.log('💾 Saving shop to database:', data.shop);
}

/**
 * Remove shop from database
 */
async function removeShopFromDatabase(shop: string) {
  // TODO: Implement database removal
  console.log('🗑️ Removing shop from database:', shop);
}
