import { useState, useRef, useEffect, useMemo } from "react";
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

export type FaleRole = "student" | "professional" | "facility" | "admin";

export function detectActiveRole(portal?: string, pathname?: string, profile: Record<string, any> = {}): FaleRole {
  const path = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
  if (path.startsWith("/admin") || portal === "admin") {
    return "admin";
  }
  if (path.startsWith("/employer") || portal === "facility") {
    return "facility";
  }
  if (profile.isStudent === true || profile.candidateLevel === "student" || profile.role === "Student") {
    return "student";
  }
  return "professional";
}

interface RoleConfig {
  name: string;
  subtitle: string;
  welcome: string;
  suggestions: string[];
  placeholder: string;
  footer: string;
  aiRoleKey: "student" | "clinician" | "hospital" | "admin";
}

const ROLE_CONFIGS: Record<FaleRole, RoleConfig> = {
  student: {
    name: "Ally",
    subtitle: "FALE Student & Internship Intelligence",
    welcome: "Hello! I am Ally, your FALE study and internship copilot. How can I assist you with clinical internship shifts, council exam preparation, or mentor huddles today?",
    suggestions: [
      "Find Internship Shifts",
      "Council Exam Prep",
      "Connect with Clinical Mentors",
      "Verify My Student ID",
    ],
    placeholder: "Ask Ally anything (e.g. Find nursing internship shifts)...",
    footer: "Accredited Curriculums · Verified Mentors · Live AI",
    aiRoleKey: "student",
  },
  professional: {
    name: "Ally",
    subtitle: "FALE Clinical Intelligence",
    welcome: "Hello! I am Ally, your FALE clinical copilot. How can I assist you with locum shifts, KYC council credentials, or escrow payouts today?",
    suggestions: [
      "Set me Open to Work",
      "Find Night ICU Shifts",
      "How Escrow Payouts Work",
      "Handover to Support Desk",
    ],
    placeholder: "Ask Ally anything (e.g. Set me open to work)...",
    footer: "Escrow-Guaranteed · KMC/MCI/INC Verified · Live AI",
    aiRoleKey: "clinician",
  },
  facility: {
    name: "Ally",
    subtitle: "Hospital Staffing & Escrow Intelligence",
    welcome: "Hello! I am Ally, your Hospital Staffing Copilot. How can I assist you with posting urgent shifts, sourcing duty clinicians, or escrow wallet management today?",
    suggestions: [
      "Post an Urgent ICU Shift",
      "Search Duty Doctors",
      "Top up Escrow Wallet",
      "Review Shortlisted Applicants",
    ],
    placeholder: "Ask Ally anything (e.g. Post night duty doctor shift)...",
    footer: "24h Escrow Settlement · Council-Verified Clinicians · Live AI",
    aiRoleKey: "hospital",
  },
  admin: {
    name: "Ally",
    subtitle: "Operations & Compliance Intelligence",
    welcome: "Hello Admin! I am Ally, your FALE Operations Copilot. How can I assist you with pending KYC approvals, facility verifications, or support escalations today?",
    suggestions: [
      "Review Candidate KYC",
      "Audit Hospital Verification",
      "Check Job Approvals",
      "Open Support Tickets",
    ],
    placeholder: "Ask Ally anything (e.g. Check pending hospital KYC)...",
    footer: "Platform Operations · Full Audit Trail · Live AI",
    aiRoleKey: "admin",
  },
};

export function FlowAIFloatingButton({ className }: AllyFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "kn" | "ml" | "hi" | "ta">("en");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const s = useApp();
  const navigate = useNavigate();

  // Dynamically resolve active role based on portal, pathname, and profile
  const activeRole = useMemo(() => {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    return detectActiveRole(s.portal, pathname, s.profile);
  }, [s.portal, s.profile]);

  const roleConfig = ROLE_CONFIGS[activeRole];

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: `m-welcome-${activeRole}`,
      sender: "ally",
      text: roleConfig.welcome,
      time: "Just now",
      suggestions: roleConfig.suggestions,
    },
  ]);

  // When role changes and user hasn't typed anything yet, dynamically update welcome message
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id.startsWith("m-welcome")) {
        return [
          {
            id: `m-welcome-${activeRole}`,
            sender: "ally",
            text: roleConfig.welcome,
            time: "Just now",
            suggestions: roleConfig.suggestions,
          },
        ];
      }
      return prev;
    });
  }, [activeRole, roleConfig]);

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
      const res: AiTaskResponse = await chatWithAlly(text, roleConfig.aiRoleKey, language, {
        userName: s.profile?.fullName || s.profile?.recruiter || "FALE Member",
        portal: s.portal,
        activeRole,
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
          description: "Hospitals in your city can now dispatch immediate locum shifts to you.",
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
          text: `I'm connected to the FALE Healthcare platform as your ${roleConfig.subtitle}. How can I assist you right now?`,
          time: "Just now",
          suggestions: roleConfig.suggestions.slice(0, 3),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (actionName: string) => {
    // Professional Clinician Actions
    if (actionName === "browse_shifts" || actionName === "open_to_work") {
      navigate({ to: "/shifts" });
      setIsOpen(false);
    } else if (actionName === "handover_human") {
      navigate({ to: activeRole === "admin" ? "/admin/support" : "/support" });
      setIsOpen(false);
    } else if (actionName === "check_earnings") {
      navigate({ to: "/earnings" });
      setIsOpen(false);
    }
    // Student Actions
    else if (actionName === "find_internships") {
      navigate({ to: "/shifts" });
      setIsOpen(false);
    } else if (actionName === "start_learning") {
      navigate({ to: "/learning" });
      setIsOpen(false);
    } else if (actionName === "join_huddle") {
      navigate({ to: "/huddle" });
      setIsOpen(false);
    }
    // Hospital / Facility Actions
    else if (actionName === "post_shift") {
      navigate({ to: "/employer/post-shift" });
      setIsOpen(false);
    } else if (actionName === "search_candidates") {
      navigate({ to: "/employer/candidates" });
      setIsOpen(false);
    } else if (actionName === "wallet_topup") {
      navigate({ to: "/employer/wallet" });
      setIsOpen(false);
    } else if (actionName === "review_applicants") {
      navigate({ to: "/employer/applicants" });
      setIsOpen(false);
    }
    // Admin Actions
    else if (actionName === "audit_candidates") {
      navigate({ to: "/admin/candidates" });
      setIsOpen(false);
    } else if (actionName === "verify_hospitals") {
      navigate({ to: "/admin/facilities" });
      setIsOpen(false);
    } else if (actionName === "job_approvals") {
      navigate({ to: "/admin/postings" });
      setIsOpen(false);
    } else if (actionName === "support_tickets") {
      navigate({ to: "/admin/support" });
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
    <div ref={cardRef} className="pointer-events-auto">
      {/* Floating Card Popover / Mobile Drawer */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-200"
          />

          <div
            role="dialog"
            aria-label="Ally AI Assistant"
            className={cn(
              "fixed z-50 flex flex-col bg-white dark:bg-card text-foreground shadow-2xl transition-all duration-300",
              // Mobile Bottom Drawer: slides up from very bottom, rounded top edges, smooth safe height
              "inset-x-0 bottom-0 h-[84vh] max-h-[90dvh] rounded-t-[2rem] rounded-b-none border-t border-border/80 p-4 pb-6 sm:pb-4 animate-in slide-in-from-bottom duration-300",
              // Desktop Popover: anchored floating card above trigger button
              "sm:inset-x-auto sm:bottom-20 sm:right-6 sm:w-[380px] sm:h-[520px] sm:max-h-[80vh] sm:rounded-3xl sm:border sm:border-border/80 sm:p-4 sm:animate-in sm:zoom-in-95 sm:slide-in-from-bottom-2"
            )}
          >
            {/* Mobile Drawer Drag / Grab Handle */}
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-2.5 sm:hidden shrink-0" />

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
                <p className="text-[10px] text-muted-foreground">{roleConfig.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Regional Language Switcher */}
              <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                <SelectTrigger
                  aria-label="Select Regional Language"
                  className="h-7 w-[105px] shrink-0 rounded-lg border border-border/70 bg-muted/50 px-2.5 py-0 text-[11px] font-bold text-foreground shadow-2xs hover:bg-muted"
                >
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  style={{ width: "auto", minWidth: "170px" }}
                  className="!w-auto !min-w-[170px] text-xs font-medium shadow-xl bg-white dark:bg-card border border-border/80 p-1 rounded-xl z-[100]"
                >
                  <SelectItem value="en" className="cursor-pointer pr-8 py-2 whitespace-nowrap text-xs font-semibold">
                    English (EN)
                  </SelectItem>
                  <SelectItem value="kn" className="cursor-pointer pr-8 py-2 whitespace-nowrap text-xs font-semibold">
                    ಕನ್ನಡ (KN)
                  </SelectItem>
                  <SelectItem value="ml" className="cursor-pointer pr-8 py-2 whitespace-nowrap text-xs font-semibold">
                    മലയാളം (ML)
                  </SelectItem>
                  <SelectItem value="hi" className="cursor-pointer pr-8 py-2 whitespace-nowrap text-xs font-semibold">
                    हिन्दी (HI)
                  </SelectItem>
                  <SelectItem value="ta" className="cursor-pointer pr-8 py-2 whitespace-nowrap text-xs font-semibold">
                    தமிழ் (TA)
                  </SelectItem>
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

                {/* Suggestions Pills underneath Ally message */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="rounded-full bg-muted/80 hover:bg-muted px-2.5 py-1 text-[11px] font-semibold text-[#FF5A1F] border border-[#FF5A1F]/25 hover:border-[#FF5A1F] transition-all cursor-pointer text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] text-muted-foreground mt-1 px-1">{m.time}</span>
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
                    : roleConfig.placeholder
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
              <span>{roleConfig.footer}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Live AI</span>
            </div>
          </div>
        </div>
      </>
    )}

      {/* Floating Action Trigger Button: White bg, Saffron icon, No shadow, Simple "Ally" */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle Ally AI"
        className={cn(
          "fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 sm:z-50 group items-center gap-2 rounded-full px-4 py-2.5 cursor-pointer",
          "bg-white dark:bg-card text-foreground shadow-md sm:shadow-none",
          "border border-border/90 dark:border-border",
          "hover:border-[#FF5A1F]/50 transition-all duration-200 active:scale-95",
          isOpen ? "border-[#FF5A1F] ring-1 ring-[#FF5A1F] hidden sm:flex" : "flex",
          className
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
