import express, { Router } from "express";
const userRoute: Router = express.Router();
import {register,list} from "../../../controller/api/user/auth/auth.controller";
import registerValidation from "../../../validations/user/auth/register";

userRoute.post("/create",registerValidation,register)
userRoute.get("/list",list)

export default userRoute;