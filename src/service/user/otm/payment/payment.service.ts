import { AppDataSource } from '../../../../config/db';
import { PaymentSession, PaymentStatus, ShopCredentials, RefundSession, RefundStatus } from '../../../../entities';
import { DeepPartial } from 'typeorm';

export class PaymentService {
  private paymentSessionRepo = AppDataSource.getRepository(PaymentSession);
  private shopCredsRepo = AppDataSource.getRepository(ShopCredentials);
  private refundSessionRepo = AppDataSource.getRepository(RefundSession);

  // ============================================
  // PAYMENT SESSION METHODS
  // ============================================

  /**
   * Create new payment session
   */
  async createPaymentSession(data: {
    shop: string;
    shopifySessionId: string;
    amount: number;
    currency: string;
    customerEmail?: string;
    test?: boolean;
    shopifyRedirectUrl?: string;
  }) {
    try {
      const session = this.paymentSessionRepo.create({
        shop: data.shop,
        shopifySessionId: data.shopifySessionId,
        amount: data.amount,
        currency: data.currency,
        status: 'pending' as PaymentStatus,
        customerEmail: data.customerEmail || null,
        test: data.test || false,
        shopifyRedirectUrl: data.shopifyRedirectUrl || null,
        // createdAt and updatedAt are auto-managed by TypeORM
      });

      return await this.paymentSessionRepo.save(session);
    } catch (error: any) {
      console.error('❌ Error creating payment session:', error);
      throw new Error(`Failed to create payment session: ${error.message}`);
    }
  }

  /**
   * Update session with OMT transaction details
   */
  async updateWithOMTTransaction(
    shopifySessionId: string,
    omtTransactionId: string,
    omtPaymentUrl: string
  ) {
    try {
      const result = await this.paymentSessionRepo.update(
        { shopifySessionId },
        {
          omtTransactionId,
          omtPaymentUrl,
          status: 'processing' as PaymentStatus,
          // updatedAt is auto-managed by @UpdateDateColumn
        }
      );

      if (result.affected === 0) {
        throw new Error(`Payment session not found: ${shopifySessionId}`);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Error updating OMT transaction:', error);
      throw error;
    }
  }

  /**
   * Get session by Shopify session ID
   */
  async getByShopifySessionId(sessionId: string) {
    try {
      return await this.paymentSessionRepo.findOne({
        where: { shopifySessionId: sessionId },
      });
    } catch (error: any) {
      console.error('❌ Error fetching payment session:', error);
      throw error;
    }
  }

  /**
   * Get session by OMT transaction ID
   */
  async getByOMTTransactionId(transactionId: string) {
    try {
      return await this.paymentSessionRepo.findOne({
        where: { omtTransactionId: transactionId },
      });
    } catch (error: any) {
      console.error('❌ Error fetching payment by OMT transaction:', error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    omtTransactionId: string,
    status: PaymentStatus,
    errorMessage?: string | null
  ) {
    try {
      const result = await this.paymentSessionRepo.update(
        { omtTransactionId },
        {
          status,
          errorMessage: errorMessage || null,
          // updatedAt is auto-managed
        }
      );

      if (result.affected === 0) {
        throw new Error(`Payment not found with OMT transaction ID: ${omtTransactionId}`);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Error updating payment status:', error);
      throw error;
    }
  }

  /**
   * Get all payments for a shop
   */
  async getPaymentsByShop(shop: string, limit: number = 50) {
    try {
      return await this.paymentSessionRepo.find({
        where: { shop },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error: any) {
      console.error('❌ Error fetching payments by shop:', error);
      throw error;
    }
  }

  // ============================================
  // REFUND SESSION METHODS
  // ============================================

  /**
   * Create refund session
   */
  async createRefund(data: {
    shopifyRefundId: string;
    paymentId: number;
    omtRefundId?: string;
    amount: number;
    currency: string;
    status: RefundStatus;
    errorMessage?: string;
  }) {
    try {
      const refund = this.refundSessionRepo.create({
        shopifyRefundId: data.shopifyRefundId,
        paymentId: data.paymentId,
        omtRefundId: data.omtRefundId || null,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        errorMessage: data.errorMessage || null,
        // createdAt and updatedAt are auto-managed
      });

      return await this.refundSessionRepo.save(refund);
    } catch (error: any) {
      console.error('❌ Error creating refund:', error);
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Get refund by Shopify refund ID
   */
  async getRefundByShopifyId(shopifyRefundId: string) {
    try {
      return await this.refundSessionRepo.findOne({
        where: { shopifyRefundId },
        relations: ['payment'],
      });
    } catch (error: any) {
      console.error('❌ Error fetching refund:', error);
      throw error;
    }
  }

  /**
   * Update refund status
   */
  async updateRefundStatus(
    shopifyRefundId: string,
    status: RefundStatus,
    omtRefundId?: string,
    errorMessage?: string
  ) {
    try {
      const updateData: DeepPartial<RefundSession> = {
        status,
        // updatedAt is auto-managed
      };

      if (omtRefundId) {
        updateData.omtRefundId = omtRefundId;
      }

      if (errorMessage) {
        updateData.errorMessage = errorMessage;
      }

      const result = await this.refundSessionRepo.update(
        { shopifyRefundId },
        updateData
      );

      if (result.affected === 0) {
        throw new Error(`Refund not found: ${shopifyRefundId}`);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Error updating refund status:', error);
      throw error;
    }
  }

  /**
   * Get all refunds for a payment
   */
  async getRefundsByPaymentId(paymentId: number) {
    try {
      return await this.refundSessionRepo.find({
        where: { paymentId },
        order: { createdAt: 'DESC' },
      });
    } catch (error: any) {
      console.error('❌ Error fetching refunds:', error);
      throw error;
    }
  }

  // ============================================
  // SHOP CREDENTIALS METHODS
  // ============================================

  /**
   * Save shop credentials (create or update) - ✅ FIXED
   */
  async saveShopCredentials(data: {
    shop: string;
    accessToken: string;
    scope?: string;
  }) {
    try {
      const existing = await this.shopCredsRepo.findOne({
        where: { shop: data.shop },
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
        installedAt: new Date(),
      });

      return await this.shopCredsRepo.save(shopCreds);
    } catch (error: any) {
      console.error('❌ Error saving shop credentials:', error);
      throw new Error(`Failed to save shop credentials: ${error.message}`);
    }
  }

  /**
   * Get shop credentials
   */
  async getShopCredentials(shop: string) {
    try {
      return await this.shopCredsRepo.findOne({
        where: { shop, isActive: true },
      });
    } catch (error: any) {
      console.error('❌ Error fetching shop credentials:', error);
      throw error;
    }
  }

  /**
   * Get all active shops
   */
  async getAllActiveShops() {
    try {
      return await this.shopCredsRepo.find({
        where: { isActive: true },
        order: { installedAt: 'DESC' },
      });
    } catch (error: any) {
      console.error('❌ Error fetching active shops:', error);
      throw error;
    }
  }

  /**
   * Mark shop as uninstalled
   */
  async markShopUninstalled(shop: string) {
    try {
      const result = await this.shopCredsRepo.update(
        { shop },
        {
          isActive: false,
          uninstalledAt: new Date(),
        }
      );

      if (result.affected === 0) {
        throw new Error(`Shop not found: ${shop}`);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Error marking shop as uninstalled:', error);
      throw error;
    }
  }

  /**
   * Delete shop credentials (complete removal)
   */
  async deleteShopCredentials(shop: string) {
    try {
      return await this.shopCredsRepo.delete({ shop });
    } catch (error: any) {
      console.error('❌ Error deleting shop credentials:', error);
      throw error;
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Check if shop exists and is active
   */
  async isShopActive(shop: string): Promise<boolean> {
    try {
      const shopCreds = await this.shopCredsRepo.findOne({
        where: { shop, isActive: true },
      });
      return !!shopCreds;
    } catch (error: any) {
      console.error('❌ Error checking shop status:', error);
      return false;
    }
  }

  /**
   * Get payment with refunds
   */
  async getPaymentWithRefunds(shopifySessionId: string) {
    try {
      const payment = await this.paymentSessionRepo.findOne({
        where: { shopifySessionId },
      });

      if (!payment) {
        return null;
      }

      const refunds = await this.refundSessionRepo.find({
        where: { paymentId: payment.id },
        order: { createdAt: 'DESC' },
      });

      return {
        ...payment,
        refunds,
      };
    } catch (error: any) {
      console.error('❌ Error fetching payment with refunds:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics for a shop
   */
  async getPaymentStats(shop: string) {
    try {
      const [total, completed, failed, pending, refunded] = await Promise.all([
        this.paymentSessionRepo.count({ where: { shop } }),
        this.paymentSessionRepo.count({ where: { shop, status: 'completed' } }),
        this.paymentSessionRepo.count({ where: { shop, status: 'failed' } }),
        this.paymentSessionRepo.count({ where: { shop, status: 'pending' } }),
        this.paymentSessionRepo.count({ where: { shop, status: 'refunded' } }),
      ]);

      return { total, completed, failed, pending, refunded };
    } catch (error: any) {
      console.error('❌ Error fetching payment stats:', error);
      throw error;
    }
  }
}
