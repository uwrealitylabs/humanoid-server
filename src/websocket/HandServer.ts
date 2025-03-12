import WebSocket, { WebSocketServer } from "ws";
import { HandData } from "../types";

export class HandServer {
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
          const handData: HandData = JSON.parse(data.toString());
          if (Array.isArray(handData.positions)) {
            this.broadcast(data, ws);
          }
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

      // Send initial connection success message
      const jsonSuccess = JSON.stringify({ positions: [] });
      ws.send(jsonSuccess);
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
