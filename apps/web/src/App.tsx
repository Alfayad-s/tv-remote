import { AppShell } from "./components/AppShell.js";
import { RemoteScreen } from "./features/remote/RemoteScreen.js";
import { ConnectionProvider } from "./store/ConnectionProvider.js";

export default function App() {
  return (
    <ConnectionProvider>
      <AppShell>
        <RemoteScreen />
      </AppShell>
    </ConnectionProvider>
  );
}
