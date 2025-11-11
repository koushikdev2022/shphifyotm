import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Role } from "./Role";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
    id!: number;

    @Column({ type: "varchar", length: 255 })
    password!: string;

    @Column({ type: "varchar", length: 255 })
    fullname!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    organization_name!: string | null;

    @Column({ type: "varchar", length: 255, unique: true })
    @Index()
    username!: string;

    @Column({ type: "varchar", length: 255, unique: true })
    @Index()
    email!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    phone!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    avatar!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    otp!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    otp_expired_at!: string | null;

    @Column({ type: "text", nullable: true })
    refresh_token!: string | null;

    @Column({ type: "tinyint", default: 0 })
    is_otp_verified!: number;

    @Column({ type: "tinyint", default: 1 })
    is_active!: number;

    @Column({ type: "bigint", nullable: false })
    role_id!: number;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;


    @ManyToOne(() => Role, (role) => role.users)
    @JoinColumn({ name: "role_id" })
    role!: Role;
}
