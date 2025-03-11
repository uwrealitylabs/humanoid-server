import { Router } from "express";
import exampleRoutes from "./example";

const router = Router();

// Register all API routes
router.use("/example", exampleRoutes);
// Add more routes here like: router.use('/users', userRoutes);

export default router;
