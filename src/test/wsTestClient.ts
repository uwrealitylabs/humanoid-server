import WebSocket from 'ws';
import fetch from 'node-fetch';
import config from "../config";

const HTTP_PORT = Number(config.port) || 3000;
const WS_PORT = Number(config.wsPort) || 3001;

const API_URL = `http://localhost:${HTTP_PORT}/api/tokens`;
const WS_URL = `ws://localhost:${WS_PORT}`;

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

interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
}

type Message = TestMessage | PingMessage | ErrorMessage;

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

async function testExpiredToken(): Promise<void> {
  try {
    console.log(`[${clientId}] Getting a short-lived token...`);
    const response = await fetch(`${API_URL}/short-lived`, { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }
    
    const { token, expiryDate } = await response.json() as TokenResponse;
    console.log(`[${clientId}] Token received: ${token}`);
    console.log(`[${clientId}] Token expires at: ${new Date(expiryDate).toLocaleTimeString()}`);
    
    console.log(`[${clientId}] Waiting for token to expire...`);
    await new Promise(resolve => setTimeout(resolve, 6000));
    console.log(`[${clientId}] Token should now be expired`);
    console.log(`[${clientId}] Attempting connection with expired token...`);
    
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    ws.on('open', () => {
      console.log(`[${clientId}] WARNING: Connected with expired token! Expiration check is not working.`);
    });
    
    ws.on('error', (error: Error) => {
      console.log(`[${clientId}] Received expected error with expired token:`, error.message);
    });
    
    ws.on('close', (code: number) => {
      if (code === 1006 || code === 1000) {
        console.log(`[${clientId}] Expiration check working correctly: Expired token was rejected`);
      }
      console.log(`[${clientId}] Disconnected: Code ${code}`);
    });
    
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    }, 5000);
    
  } catch (error) {
    console.error(`[${clientId}] Expired token test error:`, error);
  }
}

async function testAboutToExpireToken(): Promise<void> {
  try {
    console.log(`[${clientId}] Getting a short-lived token...`);
    const response = await fetch(`${API_URL}/short-lived`, { method: 'POST' });
    
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }
    
    const { token, expiryDate } = await response.json() as TokenResponse;
    console.log(`[${clientId}] Token received: ${token}`);
    console.log(`[${clientId}] Token expires at: ${new Date(expiryDate).toLocaleTimeString()}`);
    
    console.log(`[${clientId}] Connecting with valid token that will expire soon...`);
    
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    ws.on('open', () => {
      console.log(`[${clientId}] Connected with soon-to-expire token`);
      
      const testMessage: TestMessage = { 
        type: 'test', 
        data: `Hello from ${clientId} (about to expire connection)` 
      };
      ws.send(JSON.stringify(testMessage));
      
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log(`[${clientId}] WARNING: Still connected after token expiry time! Server expiry check may not be working.`);
        } else {
          console.log(`[${clientId}] Connection closed after token expired as expected.`);
        }
      }, 15000);
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as Message;
        console.log(`[${clientId}] Received message on expiring connection: ${JSON.stringify(message)}`);
        
        if (message.type === 'error' && message.message?.includes('expired')) {
          console.log(`[${clientId}] ✅ Server correctly notified about token expiration`);
        }
      } catch (error) {
        console.log(`[${clientId}] Received raw data: ${data}`);
      }
    });
    
    ws.on('error', (error: Error) => {
      console.log(`[${clientId}] Error on expiring connection:`, error.message);
    });
    
    ws.on('close', (code: number, reason: string) => {
      console.log(`[${clientId}] Expiring connection closed: Code ${code}, Reason: ${reason || 'None'}`);
      
      if (code === 4001) {
        console.log(`[${clientId}] ✅ Server correctly closed connection with token expiry code`);
      }
    });
    
  } catch (error) {
    console.error(`[${clientId}] About-to-expire token test error:`, error);
  }
}

async function runTests(): Promise<void> {
  console.log(`Starting WebSocket test client with ID: ${clientId}...`);
  
  console.log(`\n--- TESTING INVALID TOKEN (${clientId}) ---`);
  await testInvalidToken();
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log(`\n--- TESTING EXPIRED TOKEN (${clientId}) ---`);
  await testExpiredToken();
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log(`\n--- TESTING ABOUT-TO-EXPIRE TOKEN (${clientId}) ---`);
  await testAboutToExpireToken();
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  console.log(`\n--- TESTING VALID TOKEN (${clientId}) ---`);
  await testValidToken().catch(error => {
    console.error(`[${clientId}] Unhandled error:`, error);
    process.exit(1);
  });
}

runTests(); 