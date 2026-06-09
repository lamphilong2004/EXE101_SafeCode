import http from "http";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { startCleanupWorker } from "./workers/cleanup.worker.js";
import { initSocket } from "./socket.js";

await connectDb();
startCleanupWorker();

const app = createApp();
const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[SafeCode API] listening on :${env.PORT}`);
});
