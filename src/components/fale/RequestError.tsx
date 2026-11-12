import { Button } from "@/components/ui/button";

export function RequestError({ message, onRetry, retrying = false }: {
  message: string | null;
  onRetry?: (() => void) | undefined;
  retrying?: boolean;
}) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <p>{message}</p>
      {onRetry && <Button type="button" variant="outline" size="sm" disabled={retrying} onClick={onRetry} className="mt-3">{retrying ? "Retrying…" : "Retry"}</Button>}
    </div>
  );
}
