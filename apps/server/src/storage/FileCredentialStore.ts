import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { CredentialStore, StoredCredentials } from "./credentialStore.js";

function fileNameForId(tvId: string): string {
  const hash = createHash("sha256").update(tvId).digest("hex").slice(0, 16);
  return `${hash}.json`;
}

function isStoredCredentials(value: unknown): value is StoredCredentials {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record["tvId"] === "string" &&
    record["tvId"].length > 0 &&
    typeof record["host"] === "string" &&
    record["host"].length > 0 &&
    typeof record["certPem"] === "string" &&
    record["certPem"].length > 0 &&
    typeof record["keyPem"] === "string" &&
    record["keyPem"].length > 0
  );
}

export class FileCredentialStore implements CredentialStore {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = resolve(dir);
  }

  async load(tvId: string): Promise<StoredCredentials | null> {
    return this.readFile(join(this.dir, fileNameForId(tvId)));
  }

  async loadByHost(host: string): Promise<StoredCredentials | null> {
    const credentials = await this.list();
    return credentials.find((item) => item.host === host) ?? null;
  }

  async save(credentials: StoredCredentials): Promise<void> {
    if (!isStoredCredentials(credentials)) {
      throw new Error("Refusing to store incomplete pairing credentials.");
    }

    await mkdir(this.dir, { recursive: true, mode: 0o700 });
    const path = join(this.dir, fileNameForId(credentials.tvId));
    const tempPath = `${path}.tmp`;
    const body = JSON.stringify({
      tvId: credentials.tvId,
      host: credentials.host,
      certPem: credentials.certPem,
      keyPem: credentials.keyPem,
    });
    await writeFile(tempPath, body, { encoding: "utf8", mode: 0o600 });
    await rename(tempPath, path);
  }

  async clear(tvId: string): Promise<void> {
    await this.deleteFile(join(this.dir, fileNameForId(tvId)));
  }

  async clearByHost(host: string): Promise<void> {
    const credentials = await this.list();
    await Promise.all(
      credentials.filter((item) => item.host === host).map((item) => this.clear(item.tvId)),
    );
  }

  private async list(): Promise<StoredCredentials[]> {
    let names: string[];
    try {
      names = await readdir(this.dir);
    } catch (error) {
      if (isErrno(error) && error.code === "ENOENT") {
        return [];
      }
      throw error;
    }

    const loaded = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map((name) => this.readFile(join(this.dir, name))),
    );
    return loaded.filter((item): item is StoredCredentials => item !== null);
  }

  private async readFile(path: string): Promise<StoredCredentials | null> {
    try {
      const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
      return isStoredCredentials(parsed) ? parsed : null;
    } catch (error) {
      if (isErrno(error) && (error.code === "ENOENT" || error.code === "ENOTDIR")) {
        return null;
      }
      return null;
    }
  }

  private async deleteFile(path: string): Promise<void> {
    try {
      await unlink(path);
    } catch (error) {
      if (isErrno(error) && error.code === "ENOENT") {
        return;
      }
      throw error;
    }
  }
}

function isErrno(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
