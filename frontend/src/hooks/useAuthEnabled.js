import { useState, useEffect } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function useAuthEnabled() {
  const [authEnabled, setAuthEnabled] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth-status`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data.authEnabled === "boolean") {
          setAuthEnabled(data.authEnabled);
        }
      })
      .catch(() => {});
  }, []);

  return authEnabled;
}
