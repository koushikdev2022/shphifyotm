import { Request, Response, NextFunction } from "express";
import { validationResult, body, ValidationChain } from "express-validator";
import { AppDataSource } from "../../../config/db";
import { User } from "../../../entities/User";
 
// Extend Express Request to include files
// interface UploadedFile {
//     fieldname: string;
//     buffer: Buffer;
//     mimetype: string;
//     filename: string;
// }

// declare global {
//     namespace Express {
//         interface Request {
//             files?: UploadedFile[];
//         }
//     }
// }

// const parseFormDataWithFiles = (
//     req: Request,
//     res: Response,
//     next: NextFunction
// ): void => {
//     if (req.is("multipart/form-data")) {
//         const bb = busboy({ headers: req.headers });
//         const fields: Record<string, any> = {};
//         const files: UploadedFile[] = [];

//         bb.on("field", (fieldname: string, val: string) => {
//             fields[fieldname] = val;
//         });

//         bb.on("file", (fieldname: string, file: NodeJS.ReadableStream, info: busboy.FileInfo) => {
//             const chunks: Buffer[] = [];

//             file.on("data", (chunk: Buffer) => {
//                 chunks.push(chunk);
//             });

//             file.on("end", () => {
//                 files.push({
//                     fieldname,
//                     buffer: Buffer.concat(chunks),
//                     mimetype: info.mimeType,
//                     filename: info.filename,
//                 });
//                 console.log(`File uploaded: ${info.filename} (${info.mimeType})`);
//             });
//         });

//         bb.on("close", () => {
//             req.body = fields;
//             req.files = files;
//             next();
//         });

//         bb.on("error", (error: Error) => {
//             return res.status(400).json({
//                 message: "File upload error",
//                 status: false,
//                 status_code: 400,
//                 error: error.message,
//             });
//         });

//         req.pipe(bb);
//     } else {
//         next();
//     }
// };

const registerValidation: Array<ValidationChain | ((req: Request, res: Response, next: NextFunction) => void | Response)> = [
    // parseFormDataWithFiles,

     body("fullname")
            .exists()
            .withMessage("fullname is required")
            .isString()
            .withMessage("fullname must be string"),

        body("password")
            .exists()
            .withMessage("password is required")
            .isString()
            .withMessage("password must be string")
            .isLength({ min: 8 })
            .withMessage("password must be at least 8 characters long"),

        body("confirm_password")
            .exists()
            .withMessage("confirm_password is required")
            .isString()
            .withMessage("confirm_password must be string")
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("confirm_password does not match password");
                }
                return true;
            }),

        body("signup_type_id")
            .optional({ nullable: true })
            .isInt()
            .withMessage("signup_type_id must be integer"),

        body("organization_name")
            .if((value, { req }) => {
                return req.body.sign_up_type == 2;
            })
            .exists()
            .withMessage("organization_name is required when signup_type organization")
            .bail()
            .isString()
            .withMessage("organization_name must be string"),

        body("username")
            .exists()
            .withMessage("username is required")
            .isString()
            .withMessage("username must be string")
            .custom(async (value) => {
                if (value) {
                    const userRepository = AppDataSource.getRepository(User);
                    const isExist = await userRepository.findOne({
                        where: { username: value },
                    });
                    if (isExist) throw new Error("username already exist");
                }
            }),

        body("email")
            .exists()
            .withMessage("email is required")
            .isString()
            .withMessage("email must be string")
            .custom(async (value) => {
                if (value) {
                    const userRepository = AppDataSource.getRepository(User);
                    const isExist = await userRepository.findOne({
                        where: { email: value },
                    });
                    if (isExist) throw new Error("email already exist");
                }
            }),

    (req: Request, res: Response, next: NextFunction): void | Response => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: "Validation failed",
                status: false,
                status_code: 422,
                errors: errors.array(),
            });
        }
        next();
    },
];

export default registerValidation;
