// Add types that are used in API requests/responses
export interface IExample {
  id: string;
  name: string;
  description: string;
}

export interface HandData {
  positions: number[]; // Array of 17 values representing hand position data
}
