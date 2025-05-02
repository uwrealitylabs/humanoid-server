# Humanoid Server

This repository hosts backend code for the Humanoid VR teleoperation project.
The server is responsible for handling the communication between the VR client
and the robot. The app will receive messages from the VR client that encode the
shape of your hand using float values, and then forward these messages to the
robot. The robot will then use its control systems (built by WATonomous) to move
its fingers to match the shape of your hand. In the future, this server must be
capable of streaming even more data, such as head tracking information and video
feeds, between the VR client and the robot.

- **Current Design**: Built using TypeScript, WebSockets, Express.js, Node.js.
  Monolith. Goal is to scale using EC2 Auto-Scaling Groups and ALB.
- **Future Design**: Microservices architecture using Kubernetes, Docker, with
  consideration to switch to using Go/gRPC for better performance.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the following:

   ```
   PORT=3000
   NODE_ENV=development
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/app.ts` - Main Express application setup
- `src/server.ts` - Server entry point
- `src/config/` - Configuration files
- `src/routes/` - Route definitions
- `src/handlers/` - Request handlers
- `src/middleware/` - Middleware used for error handling
- `src/types/` - TypeScript type definitions, for requests, responses, models,
  etc.

## Adding New Endpoints

Endpoints are URL paths that the server listens on and responds to. We create
new endpoints to add new features to our server. To add a new endpoint:

1. Create a new route file in `src/routes/api/`. This allows you to direct
   requests to the appropriate handler.
2. Create a corresponding handler in `src/handlers/`. A handler is a class that
   contains various methods for handling different HTTP methods. Inside these
   methods, you write code for what you want to happen when a request is made to
   that endpoint.
3. Define any types you need for your requests/responses/models in `src/types/`.
   We use TypeScript to enforce predictable behavior and to let your IDE give
   you better hints.
4. Register your new route in `src/routes/api/index.ts`.

Example of adding a new `users` endpoint (purely for demonstration purposes):

```typescript
// src/routes/api/users.ts
import { Router } from "express";
import { UserHandler } from "../../controllers/users";

const router = Router();
const handler = new UserHandler();

router.get("/", handler.getAll);
router.get("/:id", handler.getById);
// Add more routes as needed

export default router;
```

Then register it in `src/routes/api/index.ts`:

```typescript
import userRoutes from "./users";
// ...
router.use("/users", userRoutes);
```

See the included example files to get an idea of how to write your new endpoint.

## Build and Test

To run the project on `localhost:3000`:

```bash
npm run dev
```

You can now test your endpoint by opening your web browser and navigating to
`http://localhost:3000/api/your-endpoint`. Try pasting these into your browser:

- `http://localhost:3000/api/example`
- `http://localhost:3000/api/example/:id`
