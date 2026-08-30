import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell.js";
import { LandingPage } from "./features/landing/LandingPage.js";
import { RemoteScreen } from "./features/remote/RemoteScreen.js";
import { isNativeAndroid } from "./native/platform.js";
import { ConnectionProvider } from "./store/ConnectionProvider.js";

function isRemotePath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = (): void => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  if (isNativeAndroid() || isRemotePath(path)) {
    return (
      <ConnectionProvider>
        <AppShell>
          <RemoteScreen />
        </AppShell>
      </ConnectionProvider>
    );
  }

  return (
    <AppShell scroll>
      <LandingPage
        onOpenRemote={() => {
          window.history.pushState({}, "", "/app");
          setPath("/app");
        }}
      />
    </AppShell>
  );
}
