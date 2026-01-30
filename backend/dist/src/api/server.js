import express from "express";
import http from "node:http";
import { env } from "../config/env.js";
import skinsRouter from "./routes/skins.js";
import matchesRouter from "./routes/matches.js";
import marketsRouter from "./routes/markets.js";
import oracleRouter from "./routes/oracle.js";
import { setupWebSocket } from "./websocket.js";
const app = express();
app.use(express.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/skins", skinsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/markets", marketsRouter);
app.use("/api/oracle", oracleRouter);
app.use((err, _req, res) => {
    console.error("API error:", err);
    res.status(500).json({ error: "internal_error" });
});
const server = http.createServer(app);
setupWebSocket(server);
server.listen(env.apiPort, () => {
    console.log(`API server listening on ${env.apiPort}`);
});
