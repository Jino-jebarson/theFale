import { useRef, useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/errorMessage";

// Keep dependent UI changes inside the action, after its awaited server request.
export function useConfirmedAction() {
  const inFlight = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<void>): Promise<boolean> {
    if (inFlight.current) return false;
    inFlight.current = true;
    setIsPending(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error(message);
      return false;
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
  }
  return { run, isPending, error };
}
