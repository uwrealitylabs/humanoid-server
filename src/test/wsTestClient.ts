import WebSocket from 'ws';
import fetch from 'node-fetch';
import config from "../config";

const HTTP_PORT = Number(config.port) || 3000;
const WS_PORT = Number(config.wsPort) || 3001;

const API_URL = `http://localhost:${HTTP_PORT}/api/tokens`;
const WS_URL = `ws://localhost:${WS_PORT}`;

// Get client ID from command line arguments or use a default
const clientId = process.argv[2] || `client-${Math.floor(Math.random() * 1000)}`;
console.log(`Starting client with ID: ${clientId}`);

interface TokenResponse {
  token: string;
  expiryDate: string;
}

interface BaseMessage {
  type: string;
}

interface TestMessage extends BaseMessage {
  type: 'test';
  data: string;
}

interface PingMessage extends BaseMessage {
  type: 'ping';
  timestamp: string;
}

type Message = TestMessage | PingMessage;

async function testValidToken(): Promise<void> {
  try {
    console.log(`[${clientId}] Getting authentication token...`);
    console.log(`[${clientId}] Making request to: ${API_URL}`);
    const response = await fetch(API_URL, { method: 'POST' });
    console.log(`[${clientId}] Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }
    
    const { token } = await response.json() as TokenResponse;
    console.log(`[${clientId}] Token received: ${token}`);
    
    console.log(`[${clientId}] Connecting to WebSocket server...`);
    console.log(`[${clientId}] WebSocket URL: ${WS_URL}`);
    console.log(`[${clientId}] Headers:`, { 'Authorization': `Bearer ${token}` });
    
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    ws.on('open', () => {
      console.log(`[${clientId}] Connected to WebSocket server`);
      
      const testMessage: TestMessage = { 
        type: 'test', 
        data: `Hello from ${clientId}` 
      };
      console.log(`[${clientId}] Sending message: ${JSON.stringify(testMessage)}`);
      ws.send(JSON.stringify(testMessage));
      
      setInterval(() => {
        const message: PingMessage = { 
          type: 'ping', 
          timestamp: new Date().toISOString() 
        };
        console.log(`[${clientId}] Sending: ${JSON.stringify(message)}`);
        ws.send(JSON.stringify(message));
      }, 5000);
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as Message;
        console.log(`[${clientId}] Received: ${JSON.stringify(message)}`);
      } catch (error) {
        console.log(`[${clientId}] Received raw data: ${data}`);
      }
    });
    
    ws.on('error', (error: Error) => {
      console.error(`[${clientId}] WebSocket error: ${error.message}`);
      console.error(`[${clientId}] Error details:`, error);
    });
    
    ws.on('close', (code: number, reason: string) => {
      console.log(`[${clientId}] Disconnected: Code ${code}`);
    });
    
    process.on('SIGINT', () => {
      console.log(`[${clientId}] Closing connection and exiting...`);
      ws.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`[${clientId}] Test failed with error:`, error);
    console.error(`[${clientId}] Error details:`, error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }
}

async function testInvalidToken(): Promise<void> {
  try {
    const invalidToken = "humanoid_token_invalid12345";
    
    console.log(`[${clientId}] Testing with invalid token...`);
    console.log(`[${clientId}] WebSocket URL: ${WS_URL}`);
    console.log(`[${clientId}] Headers:`, { 'Authorization': `Bearer ${invalidToken}` });
    
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Authorization': `Bearer ${invalidToken}`
      }
    });
    
    ws.on('open', () => {
      console.log(`[${clientId}] WARNING: Connected with invalid token! Authentication is not working properly.`);
    });
    
    ws.on('error', (error: Error) => {
      console.log(`[${clientId}] Received expected error with invalid token:`, error.message);
    });
    
    ws.on('close', (code: number, reason: string) => {
      if (code === 1006 || code === 1000) {
        console.log(`[${clientId}] Authentication working correctly: Invalid token was rejected`);
      }
      console.log(`[${clientId}] Disconnected: Code ${code}`);
    });
    
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    }, 5000);
    
  } catch (error) {
    console.error(`[${clientId}] Invalid token test error:`, error);
  }
}

async function runTests(): Promise<void> {
  console.log(`Starting WebSocket test client with ID: ${clientId}...`);
  console.log(`\n--- TESTING INVALID TOKEN (${clientId}) ---`);
  await testInvalidToken();

  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log(`\n--- TESTING VALID TOKEN (${clientId}) ---`);
  await testValidToken().catch(error => {
    console.error(`[${clientId}] Unhandled error:`, error);
    process.exit(1);
  });
}

runTests(); 