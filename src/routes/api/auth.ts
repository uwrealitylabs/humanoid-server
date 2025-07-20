import { Router } from "express"
import { AuthHandler } from "../../handlers/auth"

const router = Router()
const handler = new AuthHandler();

router.get('/request-token', handler.getToken);

router.post('/validate-token', handler.validateToken);

export default router;