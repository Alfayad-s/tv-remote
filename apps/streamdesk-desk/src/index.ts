import { STREAMDESK_DEFAULT_PORT } from "@tv-remote/streamdesk-protocol";
import { startDeskServer } from "./server.js";

const port = Number(process.env.STREAMDESK_PORT ?? STREAMDESK_DEFAULT_PORT);

const agent = await startDeskServer(Number.isFinite(port) ? port : STREAMDESK_DEFAULT_PORT);

const shutdown = (): void => {
  agent.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
