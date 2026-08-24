import type { RemoteCommand } from "./commands.js";
import type { AppErrorCode } from "./errors.js";
import type { ConnectionState, TVEvent } from "./events.js";
import type { TVDevice } from "./types.js";

export const CLIENT_MESSAGE_TYPES = [
  "CONNECT_TV",
  "DISCONNECT_TV",
  "DISCOVER_TVS",
  "REMOTE_COMMAND",
  "SEND_TEXT",
  "SUBMIT_PIN",
  "PING",
] as const;

export type ClientMessageType = (typeof CLIENT_MESSAGE_TYPES)[number];

export const SERVER_MESSAGE_TYPES = [
  "CONNECTION_STATE",
  "TV_EVENT",
  "TV_LIST",
  "ERROR",
  "PONG",
  "COMMAND_ACK",
  "IME_STATE",
] as const;

export type ServerMessageType = (typeof SERVER_MESSAGE_TYPES)[number];

interface MessageEnvelope<TType extends string, TPayload> {
  id: string;
  type: TType;
  payload: TPayload;
}

export type ConnectTvMessage = MessageEnvelope<
  "CONNECT_TV",
  {
    id?: string;
    host?: string;
    port?: number;
  }
>;

export type DisconnectTvMessage = MessageEnvelope<"DISCONNECT_TV", Record<string, never>>;

export type DiscoverTvsMessage = MessageEnvelope<"DISCOVER_TVS", Record<string, never>>;

export type RemoteCommandMessage = MessageEnvelope<
  "REMOTE_COMMAND",
  {
    command: RemoteCommand;
  }
>;

export type SubmitPinMessage = MessageEnvelope<
  "SUBMIT_PIN",
  {
    pin: string;
  }
>;

export type SendTextMessage = MessageEnvelope<
  "SEND_TEXT",
  {
    text: string;
  }
>;

export type PingMessage = MessageEnvelope<
  "PING",
  {
    timestamp: number;
  }
>;

export type ClientMessage =
  | ConnectTvMessage
  | DisconnectTvMessage
  | DiscoverTvsMessage
  | RemoteCommandMessage
  | SendTextMessage
  | SubmitPinMessage
  | PingMessage;

export type ConnectionStateMessage = MessageEnvelope<
  "CONNECTION_STATE",
  {
    state: ConnectionState;
    tv: TVDevice | null;
  }
>;

export type TvEventMessage = MessageEnvelope<
  "TV_EVENT",
  {
    event: TVEvent;
    tv: TVDevice | null;
    command?: RemoteCommand;
  }
>;

export type TvListMessage = MessageEnvelope<
  "TV_LIST",
  {
    devices: TVDevice[];
  }
>;

export type ErrorMessage = MessageEnvelope<
  "ERROR",
  {
    code: AppErrorCode;
    message: string;
  }
>;

export type PongMessage = MessageEnvelope<
  "PONG",
  {
    timestamp: number;
  }
>;

export type CommandAckMessage = MessageEnvelope<
  "COMMAND_ACK",
  {
    command: RemoteCommand;
    success: boolean;
  }
>;

export type ImeStateMessage = MessageEnvelope<
  "IME_STATE",
  {
    active: boolean;
  }
>;

export type ServerMessage =
  | ConnectionStateMessage
  | TvEventMessage
  | TvListMessage
  | ErrorMessage
  | PongMessage
  | CommandAckMessage
  | ImeStateMessage;

export type ProtocolMessage = ClientMessage | ServerMessage;
