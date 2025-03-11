import { Request, Response } from "express";
import { IExample } from "../types";

export class ExampleHandler {
  // GET all examples
  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      // This would typically come from a service or database
      const examples: IExample[] = [
        { id: "1", name: "Example 1", description: "Description 1" },
        { id: "2", name: "Example 2", description: "Description 2" },
      ];

      // 200 is the code for OK: successful response
      res.status(200).json({ data: examples });
    } catch (error) {
      // 500 is the code for Internal Server Error: unexpected error
      res.status(500).json({ error: "Failed to retrieve examples" });
    }
  };

  // GET example by ID
  public getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // This would typically come from a service or database
      const example: IExample = {
        id,
        name: `Example ${id}`,
        description: `Description for example ${id}`,
      };

      res.status(200).json({ data: example });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve example" });
    }
  };

  // POST create example
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const newExample: IExample = req.body;

      // This would typically be saved to a database

      res.status(201).json({
        message: "Example created successfully",
        data: { ...newExample, id: Math.random().toString(36).substring(7) },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create example" });
    }
  };

  // PUT update example
  public update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: Partial<IExample> = req.body;

      // This would typically update a database record

      res.status(200).json({
        message: "Example updated successfully",
        data: { id, ...updates },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update example" });
    }
  };

  // DELETE example
  public delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // This would typically delete from a database

      res.status(200).json({
        message: "Example deleted successfully",
        data: { id },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete example" });
    }
  };
}
