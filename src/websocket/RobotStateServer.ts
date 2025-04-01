import WebSocket, { WebSocketServer } from "ws";
import { TokenHandler } from "../handlers/tokens";
import { IncomingMessage } from "http";

export class RobotStateServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, string>; // WebSocket -> token
  private tokenHandler: TokenHandler;
  private expiryCheckInterval: NodeJS.Timeout | null = null;
  private readonly EXPIRY_CHECK_INTERVAL_MS = 10000; // Check every 10 seconds

  constructor(port: number) {
    this.wss = new WebSocketServer({ 
      noServer: true
     });
    this.clients = new Map();
    this.tokenHandler = new TokenHandler();

    const server = require('http').createServer();

    server.on('upgrade', async(request: IncomingMessage, socket: any, head: Buffer) =>{
      this.authenticateConnection(request, socket, head);
    })

    server.listen(port, () => {
      console.log(`Hand teleoperation WebSocket server started on port ${port}`);
    });

    this.setupWebSocketServer();
    this.startExpiryCheck();
  }

  private authenticateConnection(request: IncomingMessage, socket: any, head: Buffer){
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')){
      socket.write('HTTP/1.1 401 Unauthorized\r\n-Close-Reason: No token provided\r\n\r\n');
      socket.destroy();
      return;
    }

    const token = authHeader.substring(7);
    const isValid = this.tokenHandler.isTokenValid(token);
    
    if (isValid) {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        // Pass token to connection event by adding it to the request object
        (request as any).token = token;
        this.wss.emit('connection', ws, request);
      });
    } else {
      socket.write('HTTP/1.1 401 Unauthorized\r\n-Close-Reason: Invalid token\r\n\r\n');
      socket.destroy();
    }
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      console.log("New client connected");
      
      // Extract token from the augmented request object
      const token = (request as any).token;
      
      // Store client with its token
      this.clients.set(ws, token);

      ws.on("message", (data: Buffer) => {
        try {
          const jsonData = JSON.parse(data.toString());
          console.log("Message received:", jsonData);
          this.broadcast(JSON.stringify(jsonData), ws);
        } catch (error) {
          console.error("Error processing JSON data:", error);
        }
      });

      ws.on("close", () => {
        console.log("Client disconnected");
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(ws);
      });
    });
  }

  private startExpiryCheck() {
    // Clear any existing interval
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
    }
    
    // Set up new interval
    this.expiryCheckInterval = setInterval(() => {
      this.checkForExpiredTokens();
    }, this.EXPIRY_CHECK_INTERVAL_MS);
    
    console.log(`Token expiry check started (every ${this.EXPIRY_CHECK_INTERVAL_MS / 1000} seconds)`);
  }
  
  private checkForExpiredTokens() {
    console.log(`Checking for expired tokens (${this.clients.size} clients connected)`);
    
    this.clients.forEach((token, ws) => {
      const isStillValid = this.tokenHandler.isTokenValid(token);
      
      if (!isStillValid && ws.readyState === WebSocket.OPEN) {
        console.log(`Token expired for client. Disconnecting.`);
        
        // Send a close message to the client
        try {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Your session has expired. Please reconnect with a new token.'
          }));
        } catch (error) {
          console.error("Error sending expiry message:", error);
        }
        
        // Close with a specific code for token expiry
        ws.close(4001, 'Token expired');
        
        // Remove from our clients map
        this.clients.delete(ws);
      }
    });
  }

  private broadcast(data: Buffer | string, exclude?: WebSocket) {
    this.clients.forEach((token, client) => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
