import { Request, Response } from "express";
import { randomUUID, UUID } from "crypto";
import { addDays, hoursToMilliseconds } from "date-fns";

export class AuthHandler {
    
    // Eventually store in a database, for now just put it here
    // Map between uuid and milliseconds since epoch
    tokens: Map<UUID, Number>

    constructor(){
        this.tokens = new Map<UUID, Number>();
    }

    public getToken = async (req: Request, res: Response) => {
        try{
            const expiry_date = Date.now() + hoursToMilliseconds(24);
            const token = randomUUID();
            this.tokens.set(token, expiry_date)
            res.status(200).json({token});
        }
        catch {
            res.status(500).json({error: "Failed to generate pairing token"})
        }
    }

    public validateToken = async(req: Request, res: Response) => {
        try {
            if(!Object.hasOwn(req.body, "token")){
                res.status(412).json({error: "No pairing token provided"})
            }
            else if(this.tokens.has(req.body.token)){
                res.sendStatus(200)
            }
            else {
                res.status(412).json({error: "Invalid pairing token"})
            }
        }
        catch {
            res.status(500).json({error: "Failed to validate pairing token"})
        }
    }
}