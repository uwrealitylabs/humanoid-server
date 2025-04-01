import { Router } from "express";
import { TokenHandler } from "../../handlers/tokens";

const router = Router();
const handler = new TokenHandler();

// POST api/tokens -> generates token
router.post("/", handler.generateToken);

// POST api/tokens/short-lived -> generates short-lived token (FOR TESTING)
router.post("/short-lived", handler.generateShortLivedToken);

// GET api/tokens/:token -> validates token
router.get("/:token", handler.validateToken);

export default router;
