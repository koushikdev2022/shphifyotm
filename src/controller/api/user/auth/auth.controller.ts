import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../../../config/db";
import { User } from "../../../../entities/User";
import { generateHashPassword } from "../../../../utils/hash/hash"; 
import { generateAccessToken, generateRefreshToken } from "../../../../utils/jwt/jwt"; 

interface RegisterRequestBody {
    fullname: string;
    email: string;
    password: string;
    username:string;
    role:number;
}

export const register = async (
    req: Request<{}, {}, RegisterRequestBody>,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const { fullname, email, password,username,role } = req.body;

        if (!fullname || !email || !password) {
            return res.status(400).json({
                message: "Please provide all required fields",
                status: false,
                status_code: 400,
            });
        }

        const userRepository = AppDataSource.getRepository(User);

        const existingUser = await userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
                status: false,
                status_code: 400,
            });
        }


        const hashedPassword = await generateHashPassword(password);

        const user = userRepository.create({
            fullname,
            email,
            password: hashedPassword,
            username:username,
            role_id:role,
        });

        await userRepository.save(user);

        const accessToken = await generateAccessToken({
            id: user.id,
            email: user.email,
        });

        const refreshToken = await generateRefreshToken({
            id: user.id,
            email: user.email,
        });

        return res.status(201).json({
            message: "User registered successfully",
            status: true,
            status_code: 201,
            data: {
                id: user.id,
                name: user.fullname,
                email: user.email,
                accessToken,
                refreshToken,
            },
        });
    } catch (error: any) {
        console.error("Error in register:", error);

        const status = error?.status || 500;
        const message = error?.message || "INTERNAL_SERVER_ERROR";
        return res.status(status).json({
            message,
            status: false,
            status_code: status,
        });
    }
};

export const list = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response | void> => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        
        const users = await userRepository.find({
            where: { is_active: 1 },
            relations: {
                role: true
            },
            select: ["id", "email", "fullname", "username", "role_id"],
        });

        return res.status(200).json({
            message: "Users found",
            status: true,
            status_code: 200,
            data: users,
        });
    } catch (error: any) {
        console.error("Error in list:", error);

        const status = error?.status || 500;
        const message = error?.message || "INTERNAL_SERVER_ERROR";
        return res.status(status).json({
            message,
            status: false,
            status_code: status,
        });
    }
};
