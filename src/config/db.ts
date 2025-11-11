import { DataSource } from "typeorm";
import path from "path";

const isCompiled = __filename.endsWith('.js');

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "ts",

  synchronize: false,

  logging: process.env.NODE_ENV !== "production",
  
  entities: isCompiled
    ? [path.join(__dirname, "../entities/**/*.js")]
    : [path.join(__dirname, "../entities/**/*.ts")],
    
  migrations: isCompiled
    ? [path.join(__dirname, "../migration/**/*.js")]
    : [path.join(__dirname, "../migration/**/*.ts")],
    
  subscribers: isCompiled
    ? [path.join(__dirname, "../subscriber/**/*.js")]
    : [path.join(__dirname, "../subscriber/**/*.ts")],
});