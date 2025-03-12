// Add types that are used in API requests/responses
export interface IExample {
  id: string;
  name: string;
  description: string;
}

export interface WebSocketMessage {
  handData: number[]; // Array of 17 float values
}
