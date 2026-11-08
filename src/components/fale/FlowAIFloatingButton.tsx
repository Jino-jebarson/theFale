import { useState, useRef, useEffect } from "react";
import { BotMessageSquare, X, Send, Globe, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { chatWithAlly, type AiTaskResponse } from "@/lib/adapters/aiAdapter";
import { useApp, setState } from "@/lib/store";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AllyFloatingButtonProps {
  className?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ally";
  text: string;
  time: string;
  action?: string;
  suggestions?: string[];
}

export function FlowAIFloatingButton({ className }: AllyFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "kn" | "ml" | "hi" | "ta">("en");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-welcome",
      sender: "ally",
      text: "Hello! I am Ally, your FALE clinical copilot. How can I assist you with shifts, KYC credentials, or Escrow payouts today?",
      time: "Just now",
      suggestions: ["Set me Open to Work", "Find Night ICU Shifts", "How Escrow Payouts Work", "Handover to Support Desk"],
    },
  ]);

  const cardRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const s = useApp();
  const navigate = useNavigate();

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("[data-radix-popper-content-wrapper]") ||
        target?.closest("[role=\"listbox\"]") ||
        target?.closest("[data-radix-select-viewport]")
      ) {
        return;
      }
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const role = s.portal || "clinician";
      const res: AiTaskResponse = await chatWithAlly(text, role, language, {
        userName: s.profile?.fullName,
        portal: s.portal,
      });

      // Handle automatic actions if triggered by AI
      if (res.action === "open_to_work") {
        setState({
          profile: {
            ...s.profile,
            openToWork: true,
          },
        });
        toast.success("Status Updated: You are now Open to Work!", {
          description: "Hospitals in Bengaluru can now dispatch immediate locum shifts to you.",
        });
      } else if (res.action === "handover_human") {
        toast.info("Escalated to FALE Operations", {
          description: "A clinical specialist has been notified to assist you via WhatsApp.",
        });
      }

      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "ally",
        text: res.response,
        time: "Just now",
        action: res.action,
        suggestions: res.suggestions,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "ally",
          text: "I'm connected to the FALE healthcare platform. Your earnings are 100% escrow-backed and verified against KMC/MCI council registries. How can I help you?",
          time: "Just now",
          suggestions: ["Find ICU shifts", "How Escrow works", "Handover to Human"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (actionName: string) => {
    if (actionName === "browse_shifts" || actionName === "open_to_work") {
      navigate({ to: "/shifts" });
      setIsOpen(false);
    } else if (actionName === "handover_human") {
      navigate({ to: "/support" });
      setIsOpen(false);
    }
  };

  const languageLabels = {
    en: "English",
    kn: "ಕನ್ನಡ",
    ml: "മലയാളം",
    hi: "हिन्दी",
    ta: "தமிழ்",
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 sm:z-50 flex flex-col items-end pointer-events-auto",
        className
      )}
    >
      {/* Floating Card Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Ally AI Assistant"
          className="mb-2.5 w-[330px] sm:w-[380px] max-w-[calc(100vw-2rem)] h-[510px] max-h-[80vh] flex flex-col rounded-3xl border border-border/80 bg-white dark:bg-card p-4 text-foreground shadow-2xl animate-in slide-in-from-bottom-2 zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8.5 w-8.5 place-items-center rounded-2xl bg-[#FF5A1F]/10 text-[#FF5A1F] border border-[#FF5A1F]/20 shadow-2xs">
                <BotMessageSquare className="h-5 w-5 text-[#FF5A1F]" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black tracking-tight text-foreground">Ally</h3>
                  <span className="rounded-full bg-[#FF5A1F]/10 px-1.5 py-0.2 text-[9px] font-bold text-[#FF5A1F]">
                    AI Copilot
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">FALE Clinical Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Regional Language Switcher */}
              <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                <SelectTrigger
                  aria-label="Select Regional Language"
                  className="h-7 w-[68px] rounded-lg border border-border/70 bg-muted/50 px-2 py-0 text-[11px] font-bold text-foreground shadow-2xs hover:bg-muted"
                >
                  <SelectValue placeholder="Lang" />
                </SelectTrigger>
                <SelectContent align="end" className="min-w-[110px] text-xs font-medium">
                  <SelectItem value="en">English (EN)</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ (KN)</SelectItem>
                  <SelectItem value="ml">മലയാളം (ML)</SelectItem>
                  <SelectItem value="hi">हिन्दी (HI)</SelectItem>
                  <SelectItem value="ta">தமிழ் (TA)</SelectItem>
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close Ally"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 [scrollbar-width:thin]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col max-w-[88%] text-xs leading-relaxed",
                  m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5",
                    m.sender === "user"
                      ? "bg-[#FF5A1F] text-white rounded-br-none font-medium"
                      : "bg-muted/60 text-foreground border border-border/60 rounded-bl-none"
                  )}
                >
                  <div className="whitespace-pre-line">{m.text}</div>

                  {/* Trigger Action Pill if present */}
                  {m.action && (
                    <button
                      type="button"
                      onClick={() => executeAction(m.action!)}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-white/95 dark:bg-card px-2.5 py-1.5 text-[11px] font-bold text-[#FF5A1F] border border-[#FF5A1F]/30 shadow-2xs hover:bg-white transition-all cursor-pointer"
                    >
                      <BotMessageSquare className="h-3.5 w-3.5 text-[#FF5A1F]" />
                      <span>Execute in FALE</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Suggestions underneath message */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="rounded-full border border-[#FF5A1F]/20 bg-[#FF5A1F]/5 hover:bg-[#FF5A1F]/15 px-2.5 py-1 text-[10px] font-semibold text-[#FF5A1F] transition-colors cursor-pointer text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto bg-muted/40 px-3 py-2 rounded-2xl border border-border/50">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A1F] animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A1F] animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A1F] animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>Ally is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="pt-2 border-t border-border/60 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  language === "kn"
                    ? "Ally ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ..."
                    : language === "ml"
                    ? "Ally യോട് ചോദിക്കൂ..."
                    : language === "hi"
                    ? "Ally से पूछें..."
                    : language === "ta"
                    ? "Ally யிடம் கேளுங்கள்..."
                    : "Ask Ally anything (e.g. Set me open to work)..."
                }
                className="w-full rounded-2xl border border-border/80 bg-background/90 py-2.5 pl-3.5 pr-10 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#FF5A1F] focus:border-[#FF5A1F]"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-1.5 grid h-7 w-7 place-items-center rounded-xl bg-[#FF5A1F] text-white hover:bg-[#E04A14] disabled:opacity-40 transition-colors cursor-pointer"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground px-1">
              <span>Escrow-Guaranteed · KMC/MCI Verified</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Live AI</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button: White bg, Saffron icon, No shadow, Simple "Ally" */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle Ally AI"
        className={cn(
          "group flex items-center gap-2 rounded-full px-4 py-2.5 cursor-pointer",
          "bg-white dark:bg-card text-foreground",
          "border border-border/90 dark:border-border",
          "hover:border-[#FF5A1F]/50 transition-all duration-200 active:scale-95",
          isOpen && "border-[#FF5A1F] ring-1 ring-[#FF5A1F]"
        )}
      >
        <BotMessageSquare className="h-5 w-5 text-[#FF5A1F] shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground">
          Ally
        </span>
      </button>
    </div>
  );
}

// Named alias
export { FlowAIFloatingButton as AllyFloatingButton };
