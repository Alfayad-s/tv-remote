import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell.js";
import { ContactPage } from "./features/landing/ContactPage.js";
import { LandingPage } from "./features/landing/LandingPage.js";
import { RemoteScreen } from "./features/remote/RemoteScreen.js";
import { SpeakerScreen } from "./features/speaker/SpeakerScreen.js";
import { isNativeAndroid } from "./native/platform.js";
import { ConnectionProvider } from "./store/ConnectionProvider.js";

function isRemotePath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}

function isContactPath(pathname: string): boolean {
  return pathname === "/contact" || pathname.startsWith("/contact/");
}

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [screen, setScreen] = useState<"remote" | "speaker">("remote");

  useEffect(() => {
    const onPop = (): void => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const go = (next: string): void => {
    window.history.pushState({}, "", next);
    setPath(next);
  };

  // ConnectionProvider stays mounted across both screens; unmounting it drops the TV session.
  if (isNativeAndroid() || isRemotePath(path)) {
    return (
      <ConnectionProvider>
        <AppShell immersive={isNativeAndroid()}>
          {screen === "speaker" ? (
            <SpeakerScreen
              onBack={() => {
                setScreen("remote");
              }}
            />
          ) : (
            <RemoteScreen
              onOpenSpeaker={() => {
                setScreen("speaker");
              }}
            />
          )}
        </AppShell>
      </ConnectionProvider>
    );
  }

  return (
    <AppShell scroll>
      {isContactPath(path) ? <ContactPage onGo={go} /> : <LandingPage onGo={go} />}
    </AppShell>
  );
}
