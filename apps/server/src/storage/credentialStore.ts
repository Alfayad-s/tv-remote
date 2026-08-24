/**
 * Pairing credentials stay on the Node service, never in the PWA.
 * Never log certPem or keyPem.
 */
export interface StoredCredentials {
  tvId: string;
  host: string;
  /** PEM certificate. Never log this value. */
  certPem: string;
  /** PEM private key. Never log this value. */
  keyPem: string;
}

export interface CredentialStore {
  load(tvId: string): Promise<StoredCredentials | null>;
  loadByHost(host: string): Promise<StoredCredentials | null>;
  save(credentials: StoredCredentials): Promise<void>;
  clear(tvId: string): Promise<void>;
  clearByHost(host: string): Promise<void>;
}

export async function loadCredentials(
  store: CredentialStore,
  tvId: string,
  host: string,
): Promise<StoredCredentials | null> {
  const byId = await store.load(tvId);
  if (byId) {
    return byId;
  }
  return store.loadByHost(host);
}

export async function clearCredentials(
  store: CredentialStore,
  tvId: string,
  host: string,
): Promise<void> {
  await store.clear(tvId);
  await store.clearByHost(host);
}
