import { MigrationInterface, QueryRunner } from "typeorm";

export class User1762859205354 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          CREATE TABLE \`users\` (
            \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
            \`password\` varchar(255) NOT NULL,
            \`fullname\` varchar(255) NOT NULL,
            \`organization_name\` varchar(255) NULL,
            \`username\` varchar(255) NOT NULL,
            \`email\` varchar(255) NOT NULL,
            \`phone\` varchar(255) NULL,
            \`avatar\` varchar(255) NULL,
            \`otp\` varchar(255) NULL,
            \`otp_expired_at\` varchar(255) NULL,
            \`refresh_token\` text NULL,
            \`is_otp_verified\` tinyint NOT NULL DEFAULT 0,
            \`is_active\` tinyint NOT NULL DEFAULT 1,
            \`role_id\` bigint UNSIGNED NOT NULL,
            \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE INDEX \`IDX_username\` (\`username\`),
            UNIQUE INDEX \`IDX_email\` (\`email\`),
            PRIMARY KEY (\`id\`)
          ) ENGINE=InnoDB;
        `);

      
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_role_id\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}
