import React from "react";
import useOnlineStatus from "../hooks/useOnlineStatus";

export default function OfflineAlert() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div style={{
      backgroundColor: "#ff4d4d",
      color: "white",
      padding: "10px",
      textAlign: "center",
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 1000,
      fontWeight: "bold"
    }}>
      ⚠ No Internet Connection. Some features may not work.
    </div>
  );
}
