import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import ROSLIB from 'roslib';

export class RobotStateServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;
  private ros: ROSLIB.Ros;
  private topics: Record<string, ROSLIB.Topic> = {};

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Set();
    this.ros = new ROSLIB.Ros({
      url: 'ws://localhost:9090'
    });
    this.setupRosbridgeConnection();
    this.setupWebSocketServer();
    console.log("Hand teleoperation WebSocket server started");
  }

  private setupRosbridgeConnection(){
    this.ros.on('connection', () => {
      console.log('Connected to Rosbridge server');
    });

    this.ros.on('error', (error:any) => {
      console.error('Rosbridge error ', error);
    });

    this.ros.on('close', () => {
      console.log('Rosbridge disconnected');
    });

    this.topics["teleop"] = new ROSLIB.Topic({
      ros: this.ros,
      name: "teleop",
      messageType: "sample_msgs/HandPose"
    })
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

    const message = new ROSLIB.Message({
      data: JSON.parse(data.toString())
    });

    this.topics["teleop"].publish(message)
  }
}
