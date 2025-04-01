import { Request, Response } from "express";

export class TokenHandler {
    // Make the tokenMap static so it's shared across all instances
    private static tokenMap: Map<string, Date> = new Map();

    private generateRandomString(length: number): string {
        let result = "humanoid_token_" + Math.random().toString(36).substring(2, 12);
        return result;
    }

    public generateToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = this.generateRandomString(28);
            const expiryDate = new Date();

            expiryDate.setTime(expiryDate.getTime() + 24 * 60 * 60 * 1000);
            TokenHandler.tokenMap.set(token, expiryDate);
            
            res.status(201).json({ token, expiryDate });
        } catch (error){
            res.status(500).json({ error: "Failed to generate token."});
        }
    }

    public validateToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.params.token;

            const currentDate = new Date();
            const expiryDate = TokenHandler.tokenMap.get(token);

            if (!expiryDate){
                res.status(404).json({ valid: false, message: "Token not found" });
            } else if (currentDate < expiryDate) {
                res.status(200).json({ valid: true, expiryDate });
            } else {
                res.status(404).json({ valid: false, message: "Token expired" });
            }
        } catch(error) {
            res.status(500).json({ error: "Failed to validate token."});
        }
    }
    public isTokenValid = (token: string): boolean => {
        const currentDate = new Date();
        const expiryDate = TokenHandler.tokenMap.get(token);
        
        return !!expiryDate && currentDate < expiryDate;
    }
}