import express, { Application, Request, Response } from "express";
import routes from "./routes";
import { errorHandler, requestLogger } from "./middleware";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/api", routes.api);

app.use(errorHandler);

export default app;
