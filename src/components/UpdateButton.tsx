import { RefreshCw } from "lucide-react";
import { useServiceWorker } from "@/hooks/useServiceWorker";

export function UpdateButton() {
  const { needsUpdate, isChecking, checkForUpdate, applyUpdate } = useServiceWorker();

  if (needsUpdate) {
    return (
      <button
        onClick={applyUpdate}
        className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline"
        title="Update available - click to install"
      >
        <RefreshCw className="h-3 w-3" />
        Update
      </button>
    );
  }

  return (
    <button
      onClick={checkForUpdate}
      disabled={isChecking}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      title="Check for updates"
    >
      <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
    </button>
  );
}
