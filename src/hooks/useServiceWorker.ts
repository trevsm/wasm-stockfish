import { useCallback, useEffect, useState } from "react";

interface ServiceWorkerState {
  needsUpdate: boolean;
  isChecking: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    needsUpdate: false,
    isChecking: false,
    registration: null,
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const getRegistration = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        setState((s) => ({ ...s, registration: reg }));

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setState((s) => ({ ...s, needsUpdate: true }));
              }
            });
          }
        });

        if (reg.waiting && navigator.serviceWorker.controller) {
          setState((s) => ({ ...s, needsUpdate: true }));
        }
      }
    };

    getRegistration();
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (!state.registration) {
      if (!("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      setState((s) => ({ ...s, registration: reg }));
    }

    setState((s) => ({ ...s, isChecking: true }));

    try {
      const reg = state.registration || (await navigator.serviceWorker.getRegistration());
      if (reg) {
        await reg.update();
        if (reg.waiting) {
          setState((s) => ({ ...s, needsUpdate: true, isChecking: false }));
        } else {
          setState((s) => ({ ...s, isChecking: false }));
        }
      }
    } catch {
      setState((s) => ({ ...s, isChecking: false }));
    }
  }, [state.registration]);

  const applyUpdate = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  }, [state.registration]);

  return {
    needsUpdate: state.needsUpdate,
    isChecking: state.isChecking,
    checkForUpdate,
    applyUpdate,
  };
}
