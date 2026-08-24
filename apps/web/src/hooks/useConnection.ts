import { useContext } from "react";
import { ConnectionContext, type ConnectionStore } from "../store/connectionContext.js";

export function useConnection(): ConnectionStore {
  const value = useContext(ConnectionContext);
  if (!value) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }
  return value;
}
