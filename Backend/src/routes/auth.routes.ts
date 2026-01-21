import { Router } from "express";
import authRouter from "./auth";   // ✅ correct import

const router = Router();

router.use("/", authRouter);       // ✅ use routes from auth.ts

export default router;
