import { Router } from "express";
import exampleRoutes from "./example";
import authRoutes from "./auth";

const router = Router();

// Register all API routes

router.use("/auth", authRoutes);
router.use("/example", exampleRoutes);
// Add more routes here like: router.use('/users', userRoutes);

export default router;
