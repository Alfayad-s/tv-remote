import type { WebSocketClientHandlers } from "./websocketClient.js";
import { WebSocketClient } from "./websocketClient.js";
import { NativeTvClient } from "./nativeTvClient.js";
import { isNativeAndroid } from "../native/platform.js";

export type TvClient = WebSocketClient | NativeTvClient;

export function createTvClient(handlers: WebSocketClientHandlers): TvClient {
  if (isNativeAndroid()) {
    return new NativeTvClient(handlers);
  }
  return new WebSocketClient(handlers);
}
