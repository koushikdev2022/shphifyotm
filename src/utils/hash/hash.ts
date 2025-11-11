import bcrypt from "bcrypt";

export const generateHashPassword = async (
    passwords: string, 
    saltRounds: number = 10
): Promise<string> => {
    const password = passwords;
    return await bcrypt.hash(password, saltRounds);
};

export const checkHashPassword = async (
    password: string, 
    dbPassword: string
): Promise<boolean> => {
    return await bcrypt.compare(password, dbPassword);
};

export const generateHash = async (
    str: string, 
    saltRounds: number = 6
): Promise<string> => {
    return await bcrypt.hash(str, saltRounds);
};

export const checkHash = async (
    str: string, 
    hashStr: string
): Promise<boolean> => {
    return await bcrypt.compare(str, hashStr);
};
