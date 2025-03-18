import { Router } from "express";
import { TokenHandler } from "../../handlers/tokens";

const router = Router();
const handler = new TokenHandler();

// POST api/tokens -> generates token
router.post("/", handler.generateToken);

// GET api/tokens/:token -> validates token
router.get("/:token", handler.validateToken);

export default router;
