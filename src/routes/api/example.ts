import { Router } from "express";
import { ExampleHandler } from "../../handlers/example";

const router = Router();
const controller = new ExampleHandler();

// GET /api/example
router.get("/", controller.getAll);

// GET /api/example/:id
router.get("/:id", controller.getById);

// POST /api/example
router.post("/", controller.create);

// PUT /api/example/:id
router.put("/:id", controller.update);

// DELETE /api/example/:id
router.delete("/:id", controller.delete);

export default router;
