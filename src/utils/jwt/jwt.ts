import jwt, { SignOptions } from "jsonwebtoken";

interface UserPayload {
    id: number | string;
    role_type_id?: number;
    email?: string;
    avatar?: string;
    status?: boolean;
    created_at?: Date | string;
}

interface TokenResponse {
    success: boolean;
    data?: jwt.JwtPayload | string;
    error?: string;
}

export const generateAccessToken = async (user: UserPayload): Promise<string> => {
    const payload = {
        id: user.id,
        role_type_id: user?.role_type_id,
        email: user?.email,
        avatar: user?.avatar,
        status: user?.status,
        created_at: user?.created_at,
    };

    const secret = process.env.JWT_ACCESS_TOKEN_SECRET as string;
    const options = { expiresIn: "24h" } as SignOptions;

    return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = async (user: UserPayload): Promise<string> => {
    const payload = {
        id: user.id,
        role_type_id: user?.role_type_id,
        email: user?.email,
        avatar: user?.avatar,
        status: user?.status,
        created_at: user?.created_at,
    };

    const secret = process.env.JWT_REFRESH_TOKEN_SECRET as string;
    const options = { expiresIn: "30d" } as SignOptions;

    return jwt.sign(payload, secret, options);
};

export const verifyAccessToken = async (token: string): Promise<TokenResponse> => {
    const secret = process.env.JWT_ACCESS_TOKEN_SECRET as string;
    try {
        const decoded = jwt.verify(token, secret);
        return { success: true, data: decoded };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const verifyRefreshToken = async (token: string): Promise<TokenResponse> => {
    const secret = process.env.JWT_REFRESH_TOKEN_SECRET as string;
    try {
        const decoded = jwt.verify(token, secret);
        return { success: true, data: decoded };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};
