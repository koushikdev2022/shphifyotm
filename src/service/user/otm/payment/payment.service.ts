import { AppDataSource } from '../../../../config/db';
import { PaymentSession, ShopCredentials } from '../../../../entities';

export class PaymentService {
  private paymentSessionRepo = AppDataSource.getRepository(PaymentSession);
  private shopCredsRepo = AppDataSource.getRepository(ShopCredentials);

  // Create new payment session
  async createPaymentSession(data: {
    shop: string;
    shopifySessionId: string;
    amount: number;
    currency: string;
    shopifyRedirectUrl?: string;
    customerEmail?: string;
  }) {
    const session = this.paymentSessionRepo.create({
      shop: data.shop,
      shopifySessionId: data.shopifySessionId,
      amount: data.amount,
      currency: data.currency,
      status: 'pending',
      shopifyRedirectUrl: data.shopifyRedirectUrl || null,
      customerEmail: data.customerEmail || null,
    });

    return await this.paymentSessionRepo.save(session);
  }

  // Update session with OMT transaction ID
  async updateWithOMTTransaction(
    shopifySessionId: string, 
    omtTransactionId: string,
    omtPaymentUrl: string
  ) {
    return await this.paymentSessionRepo.update(
      { shopifySessionId },
      { 
        omtTransactionId,
        omtPaymentUrl,
        status: 'processing'
      }
    );
  }

  // Get session by Shopify session ID
  async getByShopifySessionId(sessionId: string) {
    return await this.paymentSessionRepo.findOne({
      where: { shopifySessionId: sessionId },
      relations: ['shopCredentials']
    });
  }

  // Get session by OMT transaction ID
  async getByOMTTransactionId(transactionId: string) {
    return await this.paymentSessionRepo.findOne({
      where: { omtTransactionId: transactionId },
      relations: ['shopCredentials']
    });
  }

  // Update payment status
  async updatePaymentStatus(
    omtTransactionId: string,
    status: 'completed' | 'failed' | 'refunded',
    errorMessage?: string
  ) {
    return await this.paymentSessionRepo.update(
      { omtTransactionId },
      { 
        status,
        errorMessage: errorMessage || null,
        updatedAt: new Date()
      }
    );
  }

  // Save shop credentials
  async saveShopCredentials(data: {
    shop: string;
    accessToken: string;
    scope?: string;
  }) {
    const existing = await this.shopCredsRepo.findOne({
      where: { shop: data.shop }
    });

    if (existing) {
      existing.accessToken = data.accessToken;
      existing.scope = data.scope || null;
      existing.isActive = true;
      existing.uninstalledAt = null;
      return await this.shopCredsRepo.save(existing);
    }

    const shopCreds = this.shopCredsRepo.create({
      shop: data.shop,
      accessToken: data.accessToken,
      scope: data.scope || null,
      isActive: true,
    });

    return await this.shopCredsRepo.save(shopCreds);
  }

  // Get shop credentials
  async getShopCredentials(shop: string) {
    return await this.shopCredsRepo.findOne({
      where: { shop, isActive: true }
    });
  }

  // Mark shop as uninstalled
  async markShopUninstalled(shop: string) {
    return await this.shopCredsRepo.update(
      { shop },
      { 
        isActive: false,
        uninstalledAt: new Date()
      }
    );
  }
}
