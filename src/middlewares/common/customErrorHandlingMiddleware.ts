import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
    status?: number;
    statusCode?: number;
}

export const notFoundHandler = (
    req: Request, 
    _res: Response,  // Prefix with underscore
    next: NextFunction
): void => {
    const error: CustomError = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

export const customErrorHandlingMiddleware = (
    err: CustomError,
    _req: Request,  // Prefix with underscore
    res: Response,
    _next: NextFunction  // Prefix with underscore
): void => {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};

export default {
    notFoundHandler,
    customErrorHandlingMiddleware,
};
