import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { ShopCredentials } from './ShopCredentials.entity';

class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity('payment_sessions')
@Index(['shopifySessionId']) 
@Index(['omtTransactionId'])  
@Index(['status'])
export class PaymentSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  shop: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    unique: true,
    name: 'shopify_session_id'
  })
  shopifySessionId: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true,
    name: 'omt_transaction_id'
  })
  omtTransactionId: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer()
  })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ 
    type: 'varchar', 
    length: 50,
    default: 'pending'
  })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

  @Column({ 
    type: 'text', 
    nullable: true,
    name: 'shopify_redirect_url'
  })
  shopifyRedirectUrl: string | null;

  @Column({ 
    type: 'text', 
    nullable: true,
    name: 'omt_payment_url'
  })
  omtPaymentUrl: string | null;

  @Column({ 
    type: 'text', 
    nullable: true,
    name: 'error_message'
  })
  errorMessage: string | null;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true,
    name: 'customer_email'
  })
  customerEmail: string | null;

  @Column({ 
    type: 'text', 
    nullable: true,
    name: 'metadata'
  })
  metadata: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ShopCredentials, (shopCreds: ShopCredentials) => shopCreds.paymentSessions)
  @JoinColumn({ name: 'shop', referencedColumnName: 'shop' })
  shopCredentials: ShopCredentials;
}
