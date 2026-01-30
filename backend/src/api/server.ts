import express from "express";
import http from "node:http";
import { env } from "../config/env.js";
import skinsRouter from "./routes/skins.js";
import marketsRouter from "./routes/markets.js";
import oracleRouter from "./routes/oracle.js";
import unboxRouter from "./routes/unbox.js";
import userRouter from "./routes/user.js";
import { setupWebSocket } from "./websocket.js";

export const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/skins", skinsRouter);
app.use("/api/markets", marketsRouter);
app.use("/api/oracle", oracleRouter);
app.use("/api/unbox", unboxRouter);
app.use("/api/user", userRouter);

app.use((err: Error, _req: express.Request, res: express.Response) => {
  console.error("API error:", err);
  res.status(500).json({ error: "internal_error" });
});

export function startServer() {
  const server = http.createServer(app);
  setupWebSocket(server);
  server.listen(env.apiPort, () => {
    console.log(`API server listening on ${env.apiPort}`);
  });
  return server;
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
