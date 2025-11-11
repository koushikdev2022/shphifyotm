import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { AppDataSource } from "./config/db";
import loadRoute from './router/load.route';

dotenv.config();

const app: Application = express();
const port = parseInt(process.env.PORT || "8080", 10);


app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use(express.urlencoded({ limit: "100mb", extended: false }));
app.use(express.json({ limit: "100mb" }));
app.use("/api/",loadRoute);


const connectDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log("✓ MySQL connected successfully with TypeORM");
    } catch (error) {
        console.error("✗ Database connection failed:", error);
        process.exit(1);
    }
};

const startServer = async (): Promise<void> => {
    await connectDatabase();
    
    app.listen(port, () => {
        console.log(`✓ Server running on http://localhost:${port}`);
    });
};

startServer();
