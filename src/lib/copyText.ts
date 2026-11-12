import { toast } from "sonner";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    toast.error("Could not copy. Select the text and copy it manually.");
    return false;
  }
}
