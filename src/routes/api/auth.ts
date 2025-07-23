import { Router } from "express"
import { authHandler } from "../../handlers/auth";

const router = Router()

router.get('/request-token', authHandler.getTokenCallback);

router.post('/validate-token', authHandler.validateTokenCallback);

export default router;