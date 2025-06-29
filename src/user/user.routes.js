import express from "express";
import { signUp ,signIn, getUsers, deleteUser, updateUserRole, getUser, updateUserImage, ForgetPassword} from "./user.controller.js";
import { authMiddleware, isAdmin } from "../../MiddleWare/MiddleWare.js";
import upload from "../../MiddleWare/uploadImages.js";


const userRouter = express.Router();

userRouter.get("/getUsers", getUsers);
userRouter.post("/register",upload.single("image"),signUp);
userRouter.post("/login", signIn);
userRouter.post("/deleteUser/:id", deleteUser);
userRouter.put('/update-role/:userId', updateUserRole);
userRouter.get("/getuser/:id", getUser);
userRouter.post("/updateUserImage/:id",upload.single("image"),authMiddleware, updateUserImage);
userRouter.post("/forgetPassword", ForgetPassword);

export default userRouter;