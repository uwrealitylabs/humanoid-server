import WebSocket, { WebSocketServer } from "ws";

export class RobotStateServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.clients = new Set();
    this.setupWebSocketServer();
    console.log(`Hand teleoperation WebSocket server started on port ${port}`);
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
