import { Router } from "express";
import exampleRoutes from "./example";
import tokenRoutes from "./tokens";

const router = Router();

// Register all API routes
router.use("/example", exampleRoutes);
// Add more routes here like: router.use('/users', userRoutes);
router.use("/tokens", tokenRoutes);

export default router;
