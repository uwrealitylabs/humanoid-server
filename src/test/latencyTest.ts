import WebSocket from "ws";
import { HandData } from "../types";

class CircularBuffer {
  private buffer: number[];
  private currentIndex: number = 0;
  private isFull: boolean = false;
  private sum: number = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  add(value: number) {
    if (this.isFull) {
      this.sum -= this.buffer[this.currentIndex];
    }
    this.buffer[this.currentIndex] = value;
    this.sum += value;
    this.currentIndex = (this.currentIndex + 1) % this.capacity;
    if (this.currentIndex === 0) this.isFull = true;
  }

  getStats() {
    const size = this.isFull ? this.capacity : this.currentIndex;
    if (size === 0) return { min: 0, max: 0, avg: 0, count: 0 };

    const validData = this.isFull
      ? this.buffer
      : this.buffer.slice(0, this.currentIndex);
    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const avg = this.sum / size;
    return { min, max, avg, count: size };
  }
}

class LatencyTest {
  private sender: WebSocket;
  private receiver: WebSocket;
  private messageCount: number = 0;
  private lastSentTime: number = 0;
  private latencies: CircularBuffer;
  private printInterval: NodeJS.Timeout | null = null;
  private lastPrintTime: number = 0;
  private messagesSinceLastPrint: number = 0;
  private frameInterval: number = 1000 / 72; // ~13.89ms for 72 FPS
  private lastFrameTime: number = 0;
  private running: boolean = false;

  constructor() {
    this.sender = new WebSocket("ws://localhost:3000");
    this.receiver = new WebSocket("ws://localhost:3000");
    this.latencies = new CircularBuffer(100);
    this.setupConnections();
  }

  private setupConnections() {
    let senderReady = false;
    let receiverReady = false;

    this.sender.on("open", () => {
      console.log("Sender connected");
      senderReady = true;
      if (receiverReady) this.startTest();
    });

    this.receiver.on("open", () => {
      console.log("Receiver connected");
      receiverReady = true;
      if (senderReady) this.startTest();
    });

    this.sender.on("message", (data) => {
      try {
        const latency = performance.now() - this.lastSentTime;
        this.latencies.add(latency);
        this.messageCount++;
        this.messagesSinceLastPrint++;
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    this.receiver.on("message", (data) => {
      this.receiver.send(data);
    });

    // Error handling
    this.sender.on("error", (error) => console.error("Sender error:", error));
    this.receiver.on("error", (error) =>
      console.error("Receiver error:", error)
    );

    this.sender.on("close", () => {
      console.log("Sender disconnected");
      this.cleanup();
    });
    this.receiver.on("close", () => {
      console.log("Receiver disconnected");
      this.cleanup();
    });
  }

  private cleanup() {
    this.running = false;
    if (this.printInterval) {
      clearInterval(this.printInterval);
      this.printInterval = null;
    }
  }

  private generateHandData(): HandData {
    const positions = Array.from({ length: 17 }, () => Math.random() * 2 - 1);
    return { positions };
  }

  private startTest() {
    console.log("Starting latency test at 72 FPS...");
    this.lastPrintTime = performance.now();
    this.lastFrameTime = performance.now();
    this.running = true;

    // Print stats every second
    this.printInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - this.lastPrintTime;
      const messagesPerSecond = (this.messagesSinceLastPrint * 1000) / elapsed;
      const currentFPS = Math.round(messagesPerSecond);

      const stats = this.latencies.getStats();
      console.log(`\nLatency Stats (last ${stats.count} messages):`);
      console.log(`Min: ${stats.min.toFixed(3)}ms`);
      console.log(`Max: ${stats.max.toFixed(3)}ms`);
      console.log(`Avg: ${stats.avg.toFixed(3)}ms`);
      console.log(`Current FPS: ${currentFPS}`);
      console.log(`Total messages: ${this.messageCount}`);

      this.messagesSinceLastPrint = 0;
      this.lastPrintTime = now;
    }, 1000);

    // Frame-locked message sending loop
    const frameLoop = () => {
      if (!this.running) return;

      const now = performance.now();
      const timeSinceLastFrame = now - this.lastFrameTime;

      if (timeSinceLastFrame >= this.frameInterval) {
        // Time to send a new frame
        if (this.messageCount >= 1000) {
          this.cleanup();
          const stats = this.latencies.getStats();
          console.log("\nTest completed");
          console.log(`Final Stats:`);
          console.log(`Min latency: ${stats.min.toFixed(3)}ms`);
          console.log(`Max latency: ${stats.max.toFixed(3)}ms`);
          console.log(`Avg latency: ${stats.avg.toFixed(3)}ms`);
          process.exit(0);
          return;
        }

        const handData = this.generateHandData();
        this.lastSentTime = now;
        this.sender.send(JSON.stringify(handData));
        this.lastFrameTime = now;
      }

      // Schedule next frame check
      setImmediate(frameLoop);
    };

    frameLoop();
  }
}

// Start the test
new LatencyTest();
