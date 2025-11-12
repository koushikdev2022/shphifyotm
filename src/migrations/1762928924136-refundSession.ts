import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class RefundSession1762928924136 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create refund_sessions table
        await queryRunner.createTable(
            new Table({
                name: 'refund_sessions',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'shopify_refund_id',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'payment_id',
                        type: 'int',
                        isNullable: false,
                    },
                    {
                        name: 'omt_refund_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'amount',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'currency',
                        type: 'varchar',
                        length: '3',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'processing', 'completed', 'failed'],
                        default: "'pending'",
                        isNullable: false,
                    },
                    {
                        name: 'error_message',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        // Create foreign key to payment_sessions table
        await queryRunner.createForeignKey(
            'refund_sessions',
            new TableForeignKey({
                name: 'FK_refund_sessions_payment_id',
                columnNames: ['payment_id'],
                referencedTableName: 'payment_sessions',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE', // Delete refunds if payment is deleted
                onUpdate: 'CASCADE',
            })
        );

        // Create index on payment_id for faster lookups
        await queryRunner.query(
            `CREATE INDEX IDX_refund_sessions_payment_id ON refund_sessions(payment_id)`
        );

        // Create index on shopify_refund_id for faster lookups
        await queryRunner.query(
            `CREATE INDEX IDX_refund_sessions_shopify_refund_id ON refund_sessions(shopify_refund_id)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(
            `DROP INDEX IDX_refund_sessions_shopify_refund_id ON refund_sessions`
        );
        await queryRunner.query(
            `DROP INDEX IDX_refund_sessions_payment_id ON refund_sessions`
        );

        // Drop foreign key
        await queryRunner.dropForeignKey('refund_sessions', 'FK_refund_sessions_payment_id');

        // Drop table
        await queryRunner.dropTable('refund_sessions');
    }
}
