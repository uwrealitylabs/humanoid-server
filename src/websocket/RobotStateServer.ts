import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import ROSLIB from 'roslib';
import config from "../config";

export class RobotStateServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;
  private ros: ROSLIB.Ros | null = null;
  private reconnectTimer?: NodeJS.Timeout | null = null;
  private topics: Record<string, ROSLIB.Topic> = {};

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Set();
    this.setupRosbridgeConnection();
    this.setupWebSocketServer();
    console.log("Hand teleoperation WebSocket server started");
  }

  private setupRosbridgeConnection(){
    if(this.ros){
      this.ros.close();
      this.ros = null;
    }

    this.ros = new ROSLIB.Ros({
      url: `${config.rosbridge_url}:${config.rosbridge_port}`
    });

    this.ros.on('connection', () => {
      console.log('Connected to Rosbridge server');
      if(this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.ros.on('error', (event:any) => {
      if(event.error.code !== "ECONNREFUSED"){
        console.error('Rosbridge error ', event.message);
      }
    });

    this.ros.on('close', () => {
      console.log('Rosbridge disconnected, retrying in 3s...');
      this.reconnectTimer = setTimeout(() => (this.setupRosbridgeConnection()), 3000);
    });

    if(this.ros){
      this.topics["teleop"] = new ROSLIB.Topic({
        ros: this.ros,
        name: "teleop",
        messageType: "sample_msgs/msg/VRHandPose"
      })

      this.topics["teleop"].subscribe((message: any) => {
        console.log('Received message: ' + message.positions);
      })
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

    const message = new ROSLIB.Message({
      data: JSON.parse(data.toString())
    });

    this.topics["teleop"].publish(message)
  }
}
