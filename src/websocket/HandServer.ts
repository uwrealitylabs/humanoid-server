import WebSocket, { WebSocketServer } from "ws";

interface HandData {
  id: number;
  positions: number[]; // 16 values for hand positions
}

export class HandServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
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
          if (handData.id !== undefined && Array.isArray(handData.positions)) {
            this.handleHandData(handData);
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
      const jsonSuccess = JSON.stringify({ id: -1, positions: [] });
      ws.send(jsonSuccess);
    });
  }

  private handleHandData(handData: HandData) {
    // Here you would implement the logic to control the robot's hand
    // For now, we'll just log the received data
    console.log(
      `Received hand data with ${handData.positions.length} values:`,
      handData
    );
  }

  private broadcast(data: Buffer | string, exclude?: WebSocket) {
    this.clients.forEach((client) => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
