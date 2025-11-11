import { MigrationInterface, QueryRunner } from "typeorm";

export class RoleMigration1762859259037 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          CREATE TABLE \`roles\` (
            \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
            \`name\` varchar(255) NOT NULL,
            \`short_name\` varchar(255) NOT NULL,
            \`status\` tinyint NOT NULL DEFAULT 1,
            \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`id\`)
          ) ENGINE=InnoDB;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`roles\``);
    }
}
