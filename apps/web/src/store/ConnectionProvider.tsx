import type { ConnectionState, RemoteCommand, TVDevice } from "@tv-remote/shared";
import { toUserErrorMessage } from "@tv-remote/shared";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { WebSocketClient, type ServiceStatus } from "../services/websocketClient.js";
import {
  ConnectionContext,
  type ConnectTvOptions,
  type ConnectionStore,
  type DiscoveryStatus,
} from "./connectionContext.js";

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>("connecting");
  const [tvState, setTvState] = useState<ConnectionState>("DISCONNECTED");
  const [tv, setTv] = useState<TVDevice | null>(null);
  const [devices, setDevices] = useState<TVDevice[]>([]);
  const [selectedTvId, setSelectedTvId] = useState<string | null>(null);
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<RemoteCommand | null>(null);
  const [imeActive, setImeActive] = useState(false);

  useEffect(() => {
    const client = new WebSocketClient({
      onServiceStatus: (status) => {
        setServiceStatus(status);
        if (status === "open") {
          setDiscoveryStatus("searching");
          client.discoverTvs();
        }
      },
      onMessage: (message) => {
        switch (message.type) {
          case "CONNECTION_STATE":
            setTvState(message.payload.state);
            setTv(message.payload.tv);
            if (message.payload.state === "CONNECTED" || message.payload.state === "PAIRING") {
              setLastError(null);
            }
            if (message.payload.state !== "CONNECTED") {
              setImeActive(false);
            }
            break;
          case "TV_EVENT":
            setTv(message.payload.tv);
            if (message.payload.event === "COMMAND_SENT" && message.payload.command) {
              setLastCommand(message.payload.command);
            }
            break;
          case "TV_LIST":
            setDevices(message.payload.devices);
            setDiscoveryStatus("done");
            setSelectedTvId((current) => {
              if (current && message.payload.devices.some((device) => device.id === current)) {
                return current;
              }
              const only = message.payload.devices[0];
              const mock = message.payload.devices.find((device) => device.source === "mock");
              return message.payload.devices.length === 1
                ? (only?.id ?? null)
                : (mock?.id ?? current);
            });
            break;
          case "COMMAND_ACK":
            if (message.payload.success) {
              setLastCommand(message.payload.command);
            }
            break;
          case "IME_STATE":
            setImeActive(message.payload.active);
            break;
          case "ERROR":
            setLastError(toUserErrorMessage(message.payload.code, message.payload.message));
            break;
          case "PONG":
            break;
        }
      },
      onMalformed: (reason) => {
        setLastError(reason);
      },
    });
    clientRef.current = client;
    client.connect();
    return () => {
      client.disconnect();
    };
  }, []);

  const connectTv = useCallback(
    (options?: ConnectTvOptions) => {
      setLastError(null);
      if (options?.host !== undefined || options?.id !== undefined) {
        clientRef.current?.connectTv(options);
        return;
      }
      const selected = devices.find((device) => device.id === selectedTvId);
      if (!selected) {
        setLastError("Select a TV or enter its IP address.");
        return;
      }
      clientRef.current?.connectTv({
        id: selected.id,
        host: selected.host,
        ...(selected.port === undefined ? {} : { port: selected.port }),
      });
    },
    [devices, selectedTvId],
  );

  const disconnectTv = useCallback(() => {
    clientRef.current?.disconnectTv();
  }, []);

  const sendCommand = useCallback((command: RemoteCommand) => {
    clientRef.current?.sendCommand(command);
  }, []);

  const sendText = useCallback((text: string): boolean => {
    const sent = clientRef.current?.sendText(text) ?? false;
    if (!sent) {
      setLastError("Could not reach the local service. Try sending the text again.");
    }
    return sent;
  }, []);

  const submitPin = useCallback((pin: string): boolean => {
    const sent = clientRef.current?.submitPin(pin) ?? false;
    if (!sent) {
      setLastError("Could not reach the local service. Try submitting the PIN again.");
    }
    return sent;
  }, []);

  const discoverTvs = useCallback(() => {
    setLastError(null);
    setDiscoveryStatus("searching");
    clientRef.current?.discoverTvs();
  }, []);

  const selectTv = useCallback((id: string) => {
    setSelectedTvId(id);
  }, []);

  const value = useMemo<ConnectionStore>(
    () => ({
      serviceStatus,
      tvState,
      tv,
      devices,
      selectedTvId,
      discoveryStatus,
      lastError,
      lastCommand,
      imeActive,
      connectTv,
      disconnectTv,
      sendCommand,
      sendText,
      submitPin,
      discoverTvs,
      selectTv,
    }),
    [
      serviceStatus,
      tvState,
      tv,
      devices,
      selectedTvId,
      discoveryStatus,
      lastError,
      lastCommand,
      imeActive,
      connectTv,
      disconnectTv,
      sendCommand,
      sendText,
      submitPin,
      discoverTvs,
      selectTv,
    ],
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}
