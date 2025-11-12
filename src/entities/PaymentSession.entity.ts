import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ShopCredentials } from './ShopCredentials.entity';

// ✅ Define enum type
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'captured' | 'voided';

@Entity('payment_sessions')
export class PaymentSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'shop', type: 'varchar', length: 255 })
  shop: string;

  @Column({ name: 'shopify_session_id', type: 'varchar', length: 255, unique: true })
  shopifySessionId: string;

  @Column({ name: 'omt_transaction_id', type: 'varchar', length: 255, nullable: true, unique: true })
  omtTransactionId: string | null;

  @Column({ name: 'omt_payment_url', type: 'text', nullable: true })
  omtPaymentUrl: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ 
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'captured', 'voided'],
    default: 'pending'
  })
  status: PaymentStatus;  // ✅ Use the type instead of 'string'

  @Column({ name: 'customer_email', type: 'varchar', length: 255, nullable: true })
  customerEmail: string | null;

  @Column({ name: 'shopify_redirect_url', type: 'text', nullable: true })
  shopifyRedirectUrl: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'test', type: 'boolean', default: false })
  test: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => ShopCredentials, { nullable: true })
  @JoinColumn({ name: 'shop', referencedColumnName: 'shop' })
  shopCredentials?: ShopCredentials;
}
