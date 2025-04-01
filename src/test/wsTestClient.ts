import WebSocket from 'ws';
import fetch from 'node-fetch';
import config from "../config";

const HTTP_PORT = Number(config.port) || 3000;
const WS_PORT = Number(config.wsPort) || 3001;

const API_URL = `http://localhost:${HTTP_PORT}/api/tokens`;
const WS_URL = `ws://localhost:${WS_PORT}`;

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
    console.log('Getting authentication token...');
    console.log(`Making request to: ${API_URL}`);
    const response = await fetch(API_URL, { method: 'POST' });
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }
    
    const { token } = await response.json() as TokenResponse;
    console.log(`Token received: ${token}`);
    
    console.log('Connecting to WebSocket server...');
    console.log(`WebSocket URL: ${WS_URL}`);
    console.log('Headers:', { 'Authorization': `Bearer ${token}` });
    
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    ws.on('open', () => {
      console.log('Connected to WebSocket server');
      
      const testMessage: TestMessage = { 
        type: 'test', 
        data: 'Hello from test client' 
      };
      console.log(`Sending message: ${JSON.stringify(testMessage)}`);
      ws.send(JSON.stringify(testMessage));
      
      setInterval(() => {
        const message: PingMessage = { 
          type: 'ping', 
          timestamp: new Date().toISOString() 
        };
        console.log(`Sending: ${JSON.stringify(message)}`);
        ws.send(JSON.stringify(message));
      }, 5000);
    });
    
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as Message;
        console.log(`Received: ${JSON.stringify(message)}`);
      } catch (error) {
        console.log(`Received raw data: ${data}`);
      }
    });
    
    ws.on('error', (error: Error) => {
      console.error(`WebSocket error: ${error.message}`);
      console.error('Error details:', error);
    });
    
    ws.on('close', (code: number, reason: string) => {
      console.log(`Disconnected: Code ${code}`);
    });
    
    process.on('SIGINT', () => {
      console.log('Closing connection and exiting...');
      ws.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Test failed with error:', error);
    console.error('Error details:', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }
}

async function testInvalidToken(): Promise<void> {
  try {
    const invalidToken = "humanoid_token_invalid12345";
    
    console.log('Testing with invalid token...');
    console.log(`WebSocket URL: ${WS_URL}`);
    console.log('Headers:', { 'Authorization': `Bearer ${invalidToken}` });
    
    const ws = new WebSocket(WS_URL, {
      headers: {
        'Authorization': `Bearer ${invalidToken}`
      }
    });
    
    ws.on('open', () => {
      console.log('WARNING: Connected with invalid token! Authentication is not working properly.');
    });
    
    ws.on('error', (error: Error) => {
      console.log('Received expected error with invalid token:', error.message);
    });
    
    ws.on('close', (code: number, reason: string) => {
      if (code === 1006 || code === 1000) {
        console.log('Authentication working correctly: Invalid token was rejected');
      }
      console.log(`Disconnected: Code ${code}`);
    });
    
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
    }, 5000);
    
  } catch (error) {
    console.error('Invalid token test error:', error);
  }
}

async function runTests(): Promise<void> {
  console.log('Starting WebSocket test client...');
  console.log('\n--- TESTING INVALID TOKEN ---');
  await testInvalidToken();

  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n--- TESTING VALID TOKEN ---');
  await testValidToken().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

runTests(); 