import { connect } from "node:net";
import { AppError } from "../types/errors.js";

export function probeTcp(host: string, port: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port });
    const fail = (error: AppError): void => {
      socket.removeAllListeners();
      socket.destroy();
      reject(error);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      socket.end();
      resolve();
    });
    socket.once("timeout", () => {
      fail(
        new AppError(
          "CONNECTION_TIMEOUT",
          `No response from ${host}:${String(port)}. The TV and this Node service must be on the same Wi-Fi.`,
        ),
      );
    });
    socket.once("error", (error: Error) => {
      fail(
        new AppError(
          "CONNECTION_FAILED",
          `Cannot reach the TV at ${host}:${String(port)}. ${error.message}`,
        ),
      );
    });
  });
}
