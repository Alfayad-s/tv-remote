import { createAndroidRemote } from "@kud/androidtv-remote";
import type { AndroidTvRemoteFactory } from "./client.js";

export const createKudAndroidTvRemote: AndroidTvRemoteFactory = (host, options) => {
  const remote = createAndroidRemote(host, {
    pairing_port: options.pairingPort,
    remote_port: options.remotePort,
    service_name: options.serviceName,
    model: options.model,
    ...(options.cert === undefined ? {} : { cert: options.cert }),
  });

  return {
    start: () => remote.start(),
    sendCode: (code) => remote.sendCode(code),
    sendKey: (keyCode) => {
      remote.sendKey(keyCode);
    },
    sendText: (text) => {
      remote.sendText(text);
    },
    getCertificate: () => remote.getCertificate(),
    stop: () => {
      remote.stop();
    },
    on: (event, listener) => {
      if (event === "error") {
        remote.on("error", listener as (error: Error) => void);
        return;
      }
      if (event === "current_app") {
        remote.on("current_app", listener as (appPackage: string) => void);
        return;
      }
      remote.on(event, listener as () => void);
    },
  };
};
