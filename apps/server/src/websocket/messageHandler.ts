import { validateClientMessage, type ClientMessage, type ServerMessage } from "@tv-remote/shared";
import { randomUUID } from "node:crypto";
import { withConnectionState } from "../discovery/deviceModel.js";
import type { DiscoveryService } from "../discovery/DiscoveryService.js";
import type { Logger } from "../logger.js";
import type { TVManager } from "../tv/TVManager.js";
import { AppError, isCancelledError, toAppError } from "../types/errors.js";

export interface MessageHandlerDeps {
  tvManager: TVManager;
  discovery: DiscoveryService;
  logger: Logger;
}

export async function handleClientMessage(
  raw: unknown,
  deps: MessageHandlerDeps,
): Promise<ServerMessage[]> {
  const parsed = validateClientMessage(raw);
  if (!parsed.ok) {
    deps.logger.warn("Rejected client message", { code: parsed.code });
    return [
      {
        id: randomUUID(),
        type: "ERROR",
        payload: { code: parsed.code, message: parsed.message },
      },
    ];
  }

  try {
    return await dispatch(parsed.value, deps);
  } catch (error) {
    if (isCancelledError(error)) {
      return [];
    }
    const appError = toAppError(error);
    deps.logger.error("Message handling failed", { code: appError.code, type: parsed.value.type });
    return [
      {
        id: parsed.value.id,
        type: "ERROR",
        payload: { code: appError.code, message: appError.message },
      },
    ];
  }
}

async function dispatch(
  message: ClientMessage,
  deps: MessageHandlerDeps,
): Promise<ServerMessage[]> {
  switch (message.type) {
    case "PING":
      return [
        {
          id: message.id,
          type: "PONG",
          payload: { timestamp: message.payload.timestamp },
        },
      ];
    case "DISCOVER_TVS": {
      const devices = withConnectionState(
        await deps.discovery.discover(),
        deps.tvManager.getState() === "CONNECTED" ? deps.tvManager.getDevice() : null,
      );
      return [
        {
          id: message.id,
          type: "TV_LIST",
          payload: { devices },
        },
      ];
    }
    case "CONNECT_TV": {
      await deps.tvManager.connect(message.payload);
      return [];
    }
    case "DISCONNECT_TV": {
      await deps.tvManager.disconnect();
      return [];
    }
    case "REMOTE_COMMAND": {
      await deps.tvManager.sendCommand(message.payload.command);
      return [
        {
          id: message.id,
          type: "COMMAND_ACK",
          payload: { command: message.payload.command, success: true },
        },
      ];
    }
    case "SEND_TEXT": {
      await deps.tvManager.sendText(message.payload.text);
      return [];
    }
    case "LAUNCH_APP": {
      await deps.tvManager.launchApp(message.payload.app);
      return [];
    }
    case "SUBMIT_PIN": {
      deps.logger.info("Pairing PIN submitted");
      await deps.tvManager.submitPin(message.payload.pin);
      return [];
    }
    default: {
      const exhaustive: never = message;
      throw new AppError("INVALID_MESSAGE", `Unhandled message: ${JSON.stringify(exhaustive)}`);
    }
  }
}
