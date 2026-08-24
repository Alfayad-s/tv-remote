import type { CredentialStore } from "../../storage/credentialStore.js";
import type { TvAdapterName } from "../../config/env.js";
import type { TVAdapter } from "../TVAdapter.js";
import type { AndroidTvRemoteFactory } from "../androidtv/protocol/client.js";
import { AndroidTVAdapter } from "./AndroidTVAdapter.js";
import { MockTVAdapter } from "./MockTVAdapter.js";
import { SwitchingTVAdapter } from "./SwitchingTVAdapter.js";

export interface CreateAdapterOptions {
  name: TvAdapterName;
  credentials: CredentialStore;
  pairingTimeoutMs: number;
  pairingClientName: string;
  createRemote?: AndroidTvRemoteFactory;
}

export function createAdapter(options: CreateAdapterOptions): TVAdapter {
  const androidtv = new AndroidTVAdapter({
    credentials: options.credentials,
    pairingTimeoutMs: options.pairingTimeoutMs,
    clientName: options.pairingClientName,
    ...(options.createRemote === undefined ? {} : { createRemote: options.createRemote }),
  });

  if (options.name === "androidtv") {
    return androidtv;
  }

  return new SwitchingTVAdapter({
    mock: new MockTVAdapter(),
    androidtv,
  });
}
