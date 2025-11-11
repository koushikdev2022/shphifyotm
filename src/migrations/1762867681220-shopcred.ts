import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class Shopcred1762867681220 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

         await queryRunner.createTable(
            new Table({
                name: "shop_credentials",
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
                        isUnique: true,
                        isNullable: false
                    },
                    {
                        name: "access_token",
                        type: "text",
                        isNullable: false
                    },
                    {
                        name: "scope",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true
                    },
                    {
                        name: "omt_merchant_id",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "installed_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "uninstalled_at",
                        type: "timestamp",
                        isNullable: true
                    }
                ]
            }),
            true
        );
 
        // Create indexes on shop_credentials
        await queryRunner.createIndex(
            "shop_credentials",
            new TableIndex({
                name: "IDX_SHOP_CREDENTIALS_SHOP",
                columnNames: ["shop"]
            })
        );
 
        await queryRunner.createIndex(
            "shop_credentials",
            new TableIndex({
                name: "IDX_SHOP_CREDENTIALS_ACCESS_TOKEN",
                columnNames: ["access_token"],
                isFulltext: false
            })
        );
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
