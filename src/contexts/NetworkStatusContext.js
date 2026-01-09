// src/contexts/NetworkStatusContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const NetworkStatusContext = createContext();

export function NetworkStatusProvider({ children }) {
  const [status, setStatus] = useState("loading"); // 'loading', 'ok', 'no-data', 'network-error'

  useEffect(() => {
    function updateOnlineStatus() {
      if (!navigator.onLine) {
        setStatus("network-error");
      } else {
        setStatus("loading");
      }
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();

    const docRef = doc(db, "sensorData", "latest");

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (navigator.onLine) {
          if (docSnap.exists()) {
            setStatus("ok");
          } else {
            setStatus("no-data");
          }
        }
      },
      () => setStatus("network-error")
    );

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      unsubscribe();
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={status}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  return useContext(NetworkStatusContext);
}
