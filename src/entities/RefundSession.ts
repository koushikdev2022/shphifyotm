import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentSession } from './PaymentSession.entity';

// ✅ Define enum type
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity('refund_sessions')
export class RefundSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'shopify_refund_id', type: 'varchar', length: 255, unique: true })
  shopifyRefundId: string;

  @Column({ name: 'payment_id', type: 'int' })
  paymentId: number;

  @Column({ name: 'omt_refund_id', type: 'varchar', length: 255, nullable: true })
  omtRefundId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: RefundStatus;  // ✅ Use the type instead of 'string'

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => PaymentSession, { nullable: false })
  @JoinColumn({ name: 'payment_id' })
  payment: PaymentSession;
}
