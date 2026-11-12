import { clearReadCache } from "@/lib/api";
import { useCallback, useState } from "react";
import { errorMessage } from "@/lib/errorMessage";

/** Keep load failure separate from a successfully loaded empty collection. */
export function usePageLoad() {
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const fail = useCallback((cause: unknown) => {
    setError(errorMessage(cause, "Could not load this page. Please retry."));
  }, []);
  const retry = useCallback(() => {
    clearReadCache();
    setError(null);
    setRetryKey((version) => version + 1);
  }, []);
  return { error, retryKey, fail, retry };
}
