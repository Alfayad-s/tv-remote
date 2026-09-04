import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  clipboard,
  nativeImage,
  dialog,
} from "electron";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { startDeskServer } from "../src/server.js";

interface DeskAgent {
  port: number;
  getPin: () => string;
  rotatePin: () => void;
  getConnectedCount: () => number;
  stop: () => void;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(homedir(), ".streamdesk");
const LOG_PATH = join(LOG_DIR, "desk-app.log");

function log(message: string): void {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_PATH, `${new Date().toISOString()} ${message}\n`, "utf8");
  } catch {
    // ignore logging failures
  }
  console.error(message);
}

function resolveDeskHtmlPath(): string {
  const candidates = [
    process.env.STREAMDESK_DESK_HTML?.trim(),
    join(HERE, "desk.html"),
    join(process.resourcesPath, "desk.html"),
    join(HERE, "../src/desk.html"),
  ].filter((path): path is string => Boolean(path));
  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }
  throw new Error("desk.html missing for StreamDesk Electron shell.");
}

let agent: DeskAgent | null = null;
let tray: Tray | null = null;
let arrangeWindow: BrowserWindow | null = null;
let menuRefreshTimer: ReturnType<typeof setInterval> | null = null;

function openArrange(): void {
  if (!agent) {
    return;
  }
  if (arrangeWindow && !arrangeWindow.isDestroyed()) {
    arrangeWindow.focus();
    return;
  }
  arrangeWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 720,
    minHeight: 520,
    title: "StreamDesk — Arrange apps",
    show: false,
    backgroundColor: "#f3efe4",
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
    },
  });
  arrangeWindow.once("ready-to-show", () => {
    arrangeWindow?.show();
  });
  arrangeWindow.on("closed", () => {
    arrangeWindow = null;
  });
  void arrangeWindow.loadURL(`http://127.0.0.1:${String(agent.port)}/`);
}

function rebuildMenu(): void {
  if (!tray || !agent) {
    return;
  }
  const pin = agent.getPin();
  const connected = agent.getConnectedCount();
  const openAtLogin = app.getLoginItemSettings().openAtLogin;

  const menu = Menu.buildFromTemplate([
    {
      label: `PIN ${pin}`,
      enabled: false,
    },
    {
      label: connected === 0 ? "Waiting for phone…" : `Phones connected: ${String(connected)}`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Copy PIN",
      click: () => {
        clipboard.writeText(pin);
      },
    },
    {
      label: "New PIN",
      click: () => {
        agent?.rotatePin();
        rebuildMenu();
      },
    },
    { type: "separator" },
    {
      label: "Arrange Apps…",
      click: () => {
        openArrange();
      },
    },
    {
      label: "Open at Login",
      type: "checkbox",
      checked: openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked });
      },
    },
    { type: "separator" },
    {
      label: "Quit StreamDesk",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.setToolTip(`StreamDesk · PIN ${pin}`);
}

async function boot(): Promise<void> {
  const htmlPath = resolveDeskHtmlPath();
  process.env.STREAMDESK_DESK_HTML = htmlPath;
  log(`desk.html=${htmlPath}`);

  agent = await startDeskServer();
  log(`listening port=${String(agent.port)} pin=${agent.getPin()}`);

  if (process.platform === "darwin") {
    app.dock?.hide();
  }

  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle("SD");
  tray.setIgnoreDoubleClickEvents(true);
  tray.on("click", () => {
    rebuildMenu();
    tray?.popUpContextMenu();
  });
  rebuildMenu();

  menuRefreshTimer = setInterval(() => {
    rebuildMenu();
  }, 2000);
}

log(`boot starting electron=${String(process.versions.electron)}`);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  log("another StreamDesk instance is already running — quitting");
  app.quit();
} else {
  app.on("second-instance", () => {
    rebuildMenu();
    openArrange();
  });

  app
    .whenReady()
    .then(() =>
      boot().catch((error: unknown) => {
        const message = error instanceof Error ? error.stack ?? error.message : String(error);
        log(`boot failed: ${message}`);
        dialog.showErrorBox("StreamDesk failed to start", message);
        app.quit();
      }),
    )
    .catch((error: unknown) => {
      log(`whenReady failed: ${String(error)}`);
      app.quit();
    });

  app.on("before-quit", () => {
    if (menuRefreshTimer) {
      clearInterval(menuRefreshTimer);
      menuRefreshTimer = null;
    }
    agent?.stop();
    agent = null;
    log("stopped");
  });

  app.on("window-all-closed", () => undefined);
}
