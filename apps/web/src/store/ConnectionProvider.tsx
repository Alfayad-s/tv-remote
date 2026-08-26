import type { ConnectionState, RemoteCommand, TvAppId, TVDevice } from "@tv-remote/shared";
import { toUserErrorMessage } from "@tv-remote/shared";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createTvClient, type TvClient } from "../services/tvClient.js";
import type { ServiceStatus } from "../services/websocketClient.js";
import {
  ConnectionContext,
  type ConnectTvOptions,
  type ConnectionStore,
  type DiscoveryStatus,
} from "./connectionContext.js";
import { pickSelectedTvId, withoutMockDevices } from "../utils/tvDevices.js";
import {
  readSession,
  savedTvToDevice,
  shouldRestoreOnReady,
  shouldRestoreOnResume,
  toSavedTv,
  writeSession,
  type SavedSession,
  type SavedTv,
} from "../utils/sessionStore.js";

function persist(session: SavedSession): SavedSession {
  writeSession(session);
  return session;
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<TvClient | null>(null);
  const sessionRef = useRef<SavedSession>(readSession());
  const tvStateRef = useRef<ConnectionState>(
    sessionRef.current.wanted && sessionRef.current.tv ? "CONNECTING" : "DISCONNECTED",
  );
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>("connecting");
  const [tvState, setTvState] = useState<ConnectionState>(tvStateRef.current);
  const [tv, setTv] = useState<TVDevice | null>(
    sessionRef.current.tv ? savedTvToDevice(sessionRef.current.tv) : null,
  );
  const [devices, setDevices] = useState<TVDevice[]>([]);
  const [selectedTvId, setSelectedTvId] = useState<string | null>(
    sessionRef.current.selectedTvId ?? sessionRef.current.tv?.id ?? null,
  );
  const [discoveryStatus, setDiscoveryStatus] = useState<DiscoveryStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<RemoteCommand | null>(null);
  const [imeActive, setImeActive] = useState(false);

  const updateTvState = useCallback((state: ConnectionState) => {
    tvStateRef.current = state;
    setTvState(state);
  }, []);

  const rememberTv = useCallback((next: TVDevice | SavedTv | null, wanted: boolean) => {
    const saved = next ? toSavedTv(next) : sessionRef.current.tv;
    sessionRef.current = persist({
      wanted,
      tv: saved,
      selectedTvId: next?.id ?? sessionRef.current.selectedTvId,
    });
  }, []);

  const restoreIfNeeded = useCallback(
    (reason: "ready" | "resume") => {
      const session = sessionRef.current;
      const restore =
        reason === "ready"
          ? shouldRestoreOnReady(session.wanted, session.tv, tvStateRef.current)
          : shouldRestoreOnResume(session.wanted, session.tv, tvStateRef.current);
      if (!restore || !session.tv) {
        return;
      }
      updateTvState("CONNECTING");
      clientRef.current?.connectTv({
        id: session.tv.id,
        host: session.tv.host,
        ...(session.tv.port === undefined ? {} : { port: session.tv.port }),
      });
    },
    [updateTvState],
  );

  useEffect(() => {
    const client = createTvClient({
      onServiceStatus: (status) => {
        setServiceStatus(status);
        if (status === "open") {
          setDiscoveryStatus("searching");
          client.discoverTvs();
          restoreIfNeeded("ready");
        }
        if (
          status === "closed" &&
          sessionRef.current.wanted &&
          tvStateRef.current === "CONNECTED"
        ) {
          updateTvState("RECONNECTING");
        }
      },
      onMessage: (message) => {
        switch (message.type) {
          case "CONNECTION_STATE":
            if (message.payload.tv) {
              rememberTv(
                message.payload.tv,
                sessionRef.current.wanted ||
                  message.payload.state === "CONNECTED" ||
                  message.payload.state === "PAIRING",
              );
            }
            if (message.payload.state === "DISCONNECTED" && sessionRef.current.wanted) {
              updateTvState("RECONNECTING");
            } else {
              updateTvState(message.payload.state);
            }
            setTv((current) => message.payload.tv ?? current);
            if (message.payload.state === "CONNECTED" || message.payload.state === "PAIRING") {
              setLastError(null);
            }
            if (message.payload.state !== "CONNECTED") {
              setImeActive(false);
            }
            break;
          case "TV_EVENT":
            setTv((current) => message.payload.tv ?? current);
            if (message.payload.event === "COMMAND_SENT" && message.payload.command) {
              setLastCommand(message.payload.command);
            }
            break;
          case "TV_LIST": {
            const listed = withoutMockDevices(message.payload.devices, import.meta.env.PROD);
            setDevices(listed);
            setDiscoveryStatus("done");
            setSelectedTvId((current) =>
              pickSelectedTvId(listed, current ?? sessionRef.current.selectedTvId),
            );
            break;
          }
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

    const onResume = (): void => {
      if (document.visibilityState && document.visibilityState !== "visible") {
        return;
      }
      restoreIfNeeded("resume");
    };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("pageshow", onResume);
    window.addEventListener("focus", onResume);
    const keepAlive =
      typeof window !== "undefined"
        ? window.setInterval(() => {
            const state = tvStateRef.current;
            if (state === "DISCONNECTED" || state === "ERROR") {
              restoreIfNeeded("resume");
            }
          }, 12_000)
        : undefined;

    return () => {
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("pageshow", onResume);
      window.removeEventListener("focus", onResume);
      if (keepAlive !== undefined) {
        window.clearInterval(keepAlive);
      }
      client.disconnect();
    };
  }, [rememberTv, restoreIfNeeded, updateTvState]);

  const connectTv = useCallback(
    (options?: ConnectTvOptions) => {
      setLastError(null);
      const selected = devices.find((device) => device.id === selectedTvId);
      const host = options?.host ?? selected?.host;
      const id = options?.id ?? selected?.id;
      if (!host || !id) {
        setLastError("Select a TV or enter its IP address.");
        return;
      }
      const port = options?.port ?? selected?.port;
      rememberTv(
        {
          id,
          host,
          name: selected?.name ?? sessionRef.current.tv?.name ?? "iFFALCON TV",
          ...(port === undefined ? {} : { port }),
        },
        true,
      );
      updateTvState("CONNECTING");
      clientRef.current?.connectTv({
        id,
        host,
        ...(port === undefined ? {} : { port }),
      });
    },
    [devices, rememberTv, selectedTvId, updateTvState],
  );

  const disconnectTv = useCallback(() => {
    sessionRef.current = persist({
      wanted: false,
      tv: sessionRef.current.tv,
      selectedTvId: sessionRef.current.selectedTvId,
    });
    updateTvState("DISCONNECTED");
    setImeActive(false);
    clientRef.current?.disconnectTv();
  }, [updateTvState]);

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

  const launchApp = useCallback((app: TvAppId): boolean => {
    const sent = clientRef.current?.launchApp(app) ?? false;
    if (!sent) {
      setLastError("Could not reach the local service. Try opening the app again.");
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
    sessionRef.current = persist({
      ...sessionRef.current,
      selectedTvId: id,
    });
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
      launchApp,
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
      launchApp,
      submitPin,
      discoverTvs,
      selectTv,
    ],
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}
