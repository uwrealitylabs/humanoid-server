import { Router } from "express";
import { ExampleHandler } from "../../handlers/example";

const router = Router();
const handler = new ExampleHandler();

// GET /api/example
router.get("/", handler.getAll);

// GET /api/example/:id
router.get("/:id", handler.getById);

// POST /api/example
router.post("/", handler.create);

// PUT /api/example/:id
router.put("/:id", handler.update);

// DELETE /api/example/:id
router.delete("/:id", handler.delete);

export default router;
