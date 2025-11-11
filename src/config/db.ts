// import { DataSource } from "typeorm";
// import path from "path";

// const isCompiled = __filename.endsWith('.js');

// export const AppDataSource = new DataSource({
//   type: "mysql",
//   host: process.env.DB_HOST || "localhost",
//   port: parseInt(process.env.DB_PORT || "3306", 10),
//   username: process.env.DB_USERNAME || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_DATABASE || "ts",

//   synchronize: false,

//   logging: process.env.NODE_ENV !== "production",
  
//   entities: isCompiled
//     ? [path.join(__dirname, "../entities/**/*.js")]
//     : [path.join(__dirname, "../entities/**/*.ts")],
    
//   migrations: isCompiled
//     ? [path.join(__dirname, "../migration/**/*.js")]
//     : [path.join(__dirname, "../migration/**/*.ts")],
    
//   subscribers: isCompiled
//     ? [path.join(__dirname, "../subscriber/**/*.js")]
//     : [path.join(__dirname, "../subscriber/**/*.ts")],
// });


import { DataSource } from "typeorm";
import path from "path";
import 'dotenv/config'; 
const isCompiled = __filename.endsWith('.js');

// Log environment variables
console.log('=== Database Configuration ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('Is Compiled:', isCompiled);
console.log('Current File:', __filename);
console.log('Current Dir:', __dirname);
console.log('\n=== Database Connection ===');
console.log('Host:', process.env.DB_HOST || "localhost");
console.log('Port:', process.env.DB_PORT || "3306");
console.log('Username:', process.env.DB_USERNAME || "root");
console.log('Password:', process.env.DB_PASSWORD ? '***hidden***' : '(empty)');
console.log('Database:', process.env.DB_DATABASE || "ts");
console.log('\n=== Entity Paths ===');
console.log('Entities:', isCompiled 
  ? path.join(__dirname, "../entities/**/*.js")
  : path.join(__dirname, "../entities/**/*.ts"));
console.log('Migrations:', isCompiled
  ? path.join(__dirname, "../migration/**/*.js")
  : path.join(__dirname, "../migration/**/*.ts"));
console.log('Subscribers:', isCompiled
  ? path.join(__dirname, "../subscriber/**/*.js")
  : path.join(__dirname, "../subscriber/**/*.ts"));
console.log('================================\n');

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

// Log DataSource options after creation
console.log('=== DataSource Options ===');
console.log('Type:', AppDataSource.options.type);
console.log('Database:', AppDataSource.options.database);
console.log('Synchronize:', AppDataSource.options.synchronize);
console.log('Logging:', AppDataSource.options.logging);
console.log('Entities:', AppDataSource.options.entities);
console.log('================================\n');