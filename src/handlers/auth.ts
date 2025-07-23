import { Request, Response } from "express";
import { randomUUID, UUID } from "crypto";
import { addDays, hoursToMilliseconds } from "date-fns";

class AuthHandler {
    
    // Eventually store in a database, for now just put it here
    // Map between uuid and milliseconds since epoch
    tokens: Map<string, number>

    constructor(){
        this.tokens = new Map<string, number>();
    }

    public isValidToken = (token: string|null) => {
        return token ? this.tokens.has(token) && (Date.now() < this.tokens.get(token)) : false
    }

    public getTokenCallback = async (req: Request, res: Response) => {
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

    public validateTokenCallback = async(req: Request, res: Response) => {
        try {
            if(!Object.hasOwn(req.body, "token")){
                res.status(412).json({error: "No pairing token provided"})
            }
            else if(this.isValidToken(req.body.token)){
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

export const authHandler =  new AuthHandler()