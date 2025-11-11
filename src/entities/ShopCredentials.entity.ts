import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany
} from 'typeorm';
import { PaymentSession } from './PaymentSession.entity';

@Entity('shop_credentials')
@Index(['shop'], { unique: true }) // Unique index on shop domain
export class ShopCredentials {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    unique: true 
  })
  shop: string;

  @Column({ type: 'text' })
  @Index() // Index for token lookups
  accessToken: string;

  @Column({ 
    type: 'text', 
    nullable: true 
  })
  scope: string | null;

  @Column({ 
    type: 'boolean', 
    default: true 
  })
  isActive: boolean;

  @Column({ 
    type: 'text', 
    nullable: true,
    name: 'omt_merchant_id' 
  })
  omtMerchantId: string | null; 

  @CreateDateColumn({ name: 'installed_at' })
  installedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ 
    type: 'timestamp', 
    nullable: true,
    name: 'uninstalled_at'
  })
  uninstalledAt: Date | null;

  @OneToMany(() => PaymentSession, (session) => session.shopCredentials)
  paymentSessions: PaymentSession[];
}
