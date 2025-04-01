import WebSocket, { WebSocketServer } from "ws";
import { TokenHandler } from "../handlers/tokens";
import { IncomingMessage } from "http";
export class RobotStateServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;
  private tokenHandler: TokenHandler;

  constructor(port: number) {
    this.wss = new WebSocketServer({ 
      noServer: true
     });
    this.clients = new Set();
    this.tokenHandler = new TokenHandler();

    const server = require('http').createServer();

    server.on('upgrade', async(request: IncomingMessage, socket: any, head: Buffer) =>{
      this.authenticateConnection(request, socket, head);
    })

    server.listen(port, () => {
      console.log(`Hand teleoperation WebSocket server started on port ${port}`);
    });

    this.setupWebSocketServer();
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
        this.wss.emit('connection', ws, request);
      });
    } else {
      socket.write('HTTP/1.1 401 Unauthorized\r\n-Close-Reason: Invalid token\r\n\r\n');
      socket.destroy();
    }
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("New client connected");
      this.clients.add(ws);

      ws.on("message", (data: Buffer) => {
        try {
          const jsonData = JSON.parse(data.toString());
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

  private broadcast(data: Buffer | string, exclude?: WebSocket) {
    this.clients.forEach((client) => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
