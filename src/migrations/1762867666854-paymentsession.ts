import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class Paymentsession1762867666854 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create shop_credentials table first (parent table)
       
        // Create payment_sessions table (child table)
        await queryRunner.createTable(
            new Table({
                name: "payment_sessions",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "shop",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "shopify_session_id",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                        isNullable: false
                    },
                    {
                        name: "omt_transaction_id",
                        type: "varchar",
                        length: "255",
                        isNullable: true
                    },
                    {
                        name: "amount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "currency",
                        type: "varchar",
                        length: "3",
                        isNullable: false
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "50",
                        default: "'pending'",
                        isNullable: false
                    },
                    {
                        name: "shopify_redirect_url",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "omt_payment_url",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "error_message",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "customer_email",
                        type: "varchar",
                        length: "255",
                        isNullable: true
                    },
                    {
                        name: "metadata",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Create indexes on payment_sessions
        await queryRunner.createIndex(
            "payment_sessions",
            new TableIndex({
                name: "IDX_PAYMENT_SESSIONS_SHOPIFY_SESSION_ID",
                columnNames: ["shopify_session_id"]
            })
        );

        await queryRunner.createIndex(
            "payment_sessions",
            new TableIndex({
                name: "IDX_PAYMENT_SESSIONS_OMT_TRANSACTION_ID",
                columnNames: ["omt_transaction_id"]
            })
        );

        await queryRunner.createIndex(
            "payment_sessions",
            new TableIndex({
                name: "IDX_PAYMENT_SESSIONS_STATUS",
                columnNames: ["status"]
            })
        );

        // Create foreign key relationship
       
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key first
        await queryRunner.dropForeignKey("payment_sessions", "FK_PAYMENT_SESSIONS_SHOP");

        // Drop indexes from payment_sessions
        await queryRunner.dropIndex("payment_sessions", "IDX_PAYMENT_SESSIONS_STATUS");
        await queryRunner.dropIndex("payment_sessions", "IDX_PAYMENT_SESSIONS_OMT_TRANSACTION_ID");
        await queryRunner.dropIndex("payment_sessions", "IDX_PAYMENT_SESSIONS_SHOPIFY_SESSION_ID");

        // Drop payment_sessions table
        await queryRunner.dropTable("payment_sessions");

        // Drop indexes from shop_credentials
        await queryRunner.dropIndex("shop_credentials", "IDX_SHOP_CREDENTIALS_ACCESS_TOKEN");
        await queryRunner.dropIndex("shop_credentials", "IDX_SHOP_CREDENTIALS_SHOP");

        // Drop shop_credentials table
        await queryRunner.dropTable("shop_credentials");
    }
}
