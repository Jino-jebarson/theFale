import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineQuestionMarkCircle,
  HiOutlineDocumentCheck,
  HiOutlineBuildingOffice2,
  HiOutlineCheckBadge,
  HiOutlineClipboardDocument,
  HiCheck,
  HiOutlineSparkles,
  HiOutlinePaperAirplane,
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineLifebuoy,
  HiOutlineCurrencyRupee,
  HiOutlineAcademicCap,
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineLockClosed,
  HiOutlineHandThumbUp,
  HiOutlineHandThumbDown,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineBuildingLibrary,
  HiOutlineScale,
  HiOutlineUserGroup,
  HiOutlineSignal,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Enterprise Help & Support Desk — FALE Healthcare" },
      {
        name: "description",
        content:
          "Official FALE Healthcare Help Desk & Priority Concierge. Reach our clinical team at contact@thefale.com or +91 73383 67726 for DigiLocker verification, 24-hr shift payouts, and hospital staffing assistance.",
      },
      { property: "og:title", content: "Enterprise Help & Support Desk — FALE Healthcare" },
      {
        property: "og:description",
        content: "24/7 healthcare professional and hospital concierge support.",
      },
    ],
  }),
  component: SupportPage,
});

const SUPPORT_EMAIL = "contact@thefale.com";
const SUPPORT_PHONE = "+91 73383 67726";
const SUPPORT_PHONE_RAW = "+917338367726";
const WHATSAPP_URL =
  "https://wa.me/917338367726?text=Hi%20FALE%20Healthcare%20Support%2C%20I%20need%20priority%20assistance%20with%20my%20account%2Fshift%3A%20";

type ProductCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof HiOutlineShieldCheck;
  filterTag: string;
  badge: string;
  pillColor: string;
};

const productCards: ProductCard[] = [
  {
    id: "clinicians",
    title: "Healthcare Professionals",
    subtitle: "Shifts, digital timesheet sign-offs, and automated 24-hr IMPS payouts",
    icon: HiOutlineAcademicCap,
    filterTag: "candidate",
    badge: "Clinician Care",
    pillColor: "text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800",
  },
  {
    id: "hospitals",
    title: "Hospitals & Medical Centers",
    subtitle: "Emergency ICU/OT shift broadcast, staffing escrows, and staff verification",
    icon: HiOutlineBuildingOffice2,
    filterTag: "facility",
    badge: "Enterprise Desk",
    pillColor: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
  },
  {
    id: "escrow",
    title: "Escrow & Instant Payouts",
    subtitle: "RBI nodal bank deposits, standby cancellation fees, and TDS reports",
    icon: HiOutlineCurrencyRupee,
    filterTag: "escrow",
    badge: "24-Hr SLA",
    pillColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "digilocker",
    title: "DigiLocker & Council KYC",
    subtitle: "ABHA Health ID sync, NMC/INC license authentication, and badge issuance",
    icon: HiOutlineDocumentCheck,
    filterTag: "verification",
    badge: "Government Synced",
    pillColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  },
];

type FAQItem = {
  id: string;
  category: "candidate" | "facility" | "escrow" | "verification";
  q: string;
  a: string;
  readTime: string;
  badge: string;
};

const faqs: FAQItem[] = [
  {
    id: "faq-1",
    category: "escrow",
    q: "How fast are per-diem shift payments credited to my verified bank account?",
    a: "Every shift completed on FALE is backed by institutional pre-funded escrow. Once your duty concludes and the hospital duty administrator signs off on your digital timesheet, payout is triggered automatically. Funds arrive via instant IMPS transfer into your verified bank account within 24 hours without administrative deductions.",
    readTime: "1 min read",
    badge: "Payments & Escrow",
  },
  {
    id: "faq-2",
    category: "verification",
    q: "How does DigiLocker clinical credential verification work on FALE?",
    a: "FALE connects securely with India's National Health Authority (ABHA) and State Nursing & Medical Council registries through DigiLocker. Clinicians can authenticate their medical degree, nursing diploma, or active registration number in under 60 seconds. Once verified, a clinical shield badge appears on your profile, unlocking Tier-1 hospital shifts and higher per-hour compensations.",
    readTime: "2 min read",
    badge: "KYC & Credentials",
  },
  {
    id: "faq-3",
    category: "candidate",
    q: "What is FALE's Fair Standby Policy if a hospital cancels a confirmed shift?",
    a: "To protect healthcare workers' valuable time, FALE enforces a strict 4-hour standby guarantee. If a partner hospital cancels a confirmed per-diem booking within 4 hours of the shift reporting time, a 50% guaranteed standby fee is automatically credited to the clinician's wallet from the hospital's pre-funded reserve.",
    readTime: "1 min read",
    badge: "Clinician Rights",
  },
  {
    id: "faq-4",
    category: "facility",
    q: "How does FALE vet healthcare professionals before they arrive at our hospital?",
    a: "Every clinician on FALE passes our 4-tier verification protocol: 1) Active State Medical / Nursing Council registration verification via DigiLocker, 2) Biometric identity check, 3) ICU/OT departmental competency checklist, and 4) Past peer hospital performance ratings. No unverified professional is ever permitted to accept a shift booking.",
    readTime: "2 min read",
    badge: "Hospital Staffing",
  },
  {
    id: "faq-5",
    category: "facility",
    q: "How can our hospital broadcast an emergency shift when our staff is short on duty?",
    a: "From the Hospital Portal, navigate to 'Post a shift', select the required specialization (e.g. ICU Intensivist, OT Scrub Nurse, ER Physician), select the shift timing, and confirm the hourly payout. FALE's proximity dispatch engine pings verified clinicians within a 15 km radius via automated push, SMS, and WhatsApp alerts for immediate acceptance.",
    readTime: "2 min read",
    badge: "Emergency Broadcast",
  },
  {
    id: "faq-6",
    category: "escrow",
    q: "Are client hospital funds protected in an RBI-compliant institutional account?",
    a: "Yes. All employer payments and clinician earnings are managed through a scheduled commercial bank nodal escrow account complying with Reserve Bank of India (RBI) nodal banking directives. Funds are held in trust and disbursed strictly upon timesheet verification.",
    readTime: "1 min read",
    badge: "Regulatory Compliance",
  },
];

function SupportPage() {
  const s = useApp();
  const [copiedType, setCopiedType] = useState<"email" | "phone" | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<"faqs" | "ticket" | "track" | "escalation">("faqs");
  const [faqCategory, setFaqCategory] = useState<"all" | "candidate" | "facility" | "escrow" | "verification">("all");
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, "yes" | "no">>({});

  // Ticket Form state
  const [userRole, setUserRole] = useState<"candidate" | "facility">(s.portal || "candidate");
  const [fullName, setFullName] = useState(String(s.profile["name"] || s.profile["recruiter"] || ""));
  const [email, setEmail] = useState(String(s.profile["email"] || ""));
  const [phone, setPhone] = useState(String(s.profile["phone"] || ""));
  const [category, setCategory] = useState("verification");
  const [urgency, setUrgency] = useState<"standard" | "high" | "emergency">("standard");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    category: string;
    urgency: string;
    timestamp: string;
  } | null>(null);

  // Ticket status tracker input
  const [trackIdInput, setTrackIdInput] = useState("");
  const [trackedStatus, setTrackedStatus] = useState<{
    id: string;
    status: string;
    step: number;
    agent: string;
    eta: string;
    type: string;
    lastUpdate: string;
  } | null>(null);

  const copyToClipboard = async (text: string, type: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success(`${type === "email" ? "Email address" : "Phone number"} copied to clipboard!`, {
        description: text,
      });
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      toast.info(`Contact: ${text}`);
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      toast.error("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketRef = `FALE-${urgency === "emergency" ? "EMG" : "CARE"}-${Math.floor(10000 + Math.random() * 90000)}`;
      setSubmittedTicket({
        id: ticketRef,
        category,
        urgency,
        timestamp: "Just now",
      });
      toast.success("Support ticket logged successfully!", {
        description: `Ticket Reference: #${ticketRef}. Confirmation dispatched to ${email}.`,
      });
    }, 700);
  };

  const handleTrackTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackIdInput.trim()) {
      toast.error("Please enter a ticket reference ID (e.g. FALE-CARE-84920).");
      return;
    }
    const cleanId = trackIdInput.trim().toUpperCase();
    const isEmg = cleanId.includes("EMG");
    setTrackedStatus({
      id: cleanId,
      status: isEmg ? "Active Clinical Dispatch · Level 1 Expedited" : "In Review with Senior Clinical Lead",
      step: isEmg ? 3 : 2,
      agent: "Dr. Kavitha Menon (Chief Healthcare Operations Lead)",
      eta: isEmg ? "Within 15 minutes" : "Within 45 minutes",
      type: "Clinical Credential & 24-Hr Escrow Review",
      lastUpdate: "3 mins ago (Automated timesheet verification check)",
    });
    toast.success(`Ticket #${cleanId} retrieved successfully`);
  };

  const handleFeedback = (faqId: string, val: "yes" | "no") => {
    setHelpfulFeedback((prev) => ({ ...prev, [faqId]: val }));
    toast.success("Thank you for your feedback!", {
      description: "Our documentation team uses this to improve support articles.",
    });
  };

  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      return faqCategory === "all" || item.category === faqCategory;
    });
  }, [faqCategory]);

  return (
    <AppShell>
      <div className="w-full min-w-0 space-y-10 pb-24 max-w-6xl mx-auto">
        {/* ================= 1. MINIMALIST EXECUTIVE HERO ================= */}
        <div className="relative pt-6 sm:pt-10 pb-2 text-center space-y-4">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-full max-w-3xl rounded-full bg-gradient-to-r from-primary/10 via-sky-400/5 to-emerald-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs backdrop-blur-md">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="whitespace-nowrap text-[11px] sm:text-xs">
                FALE Care · Enterprise Support Desk
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.15]">
              How can we assist you today?
            </h1>

            <p className="text-xs sm:text-base text-muted-foreground font-normal max-w-xl mx-auto leading-relaxed">
              Direct priority assistance for doctors, nurses, and hospital administrators. Connect with our clinical operations desk or explore dedicated service hubs.
            </p>
          </div>
        </div>

        {/* ================= 2. NAUKRI FASTFORWARD DIRECT CONTACT RIBBON ================= */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute right-0 top-0 h-48 w-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5 max-w-lg">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Live Operations Desk</span>
                </span>
                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                  Average Response: &lt; 15 mins
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Speak directly with our concierge team
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect directly with our senior healthcare staffing coordinators. Mon - Sat: 9:00 AM – 8:00 PM IST (24/7 dedicated support for active per-diem hospital shifts).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Email Button with Quick Copy */}
              <div className="flex items-center rounded-2xl border border-border bg-muted/40 p-1">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5 h-10 px-3 text-foreground hover:bg-card"
                >
                  <a href={`mailto:${SUPPORT_EMAIL}?subject=FALE%20Healthcare%20Concierge%20Request`}>
                    <HiOutlineEnvelope className="h-4 w-4 text-primary" />
                    <span>{SUPPORT_EMAIL}</span>
                  </a>
                </Button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SUPPORT_EMAIL, "email")}
                  className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                  title="Copy email to clipboard"
                >
                  {copiedType === "email" ? (
                    <HiCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <HiOutlineClipboardDocument className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Phone Button with Quick Copy */}
              <div className="flex items-center rounded-2xl border border-border bg-muted/40 p-1">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5 h-10 px-3 text-foreground hover:bg-card"
                >
                  <a href={`tel:${SUPPORT_PHONE_RAW}`}>
                    <HiOutlinePhone className="h-4 w-4 text-emerald-600" />
                    <span>{SUPPORT_PHONE}</span>
                  </a>
                </Button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SUPPORT_PHONE, "phone")}
                  className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                  title="Copy phone to clipboard"
                >
                  {copiedType === "phone" ? (
                    <HiCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <HiOutlineClipboardDocument className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* WhatsApp Live Chat Button */}
              <Button
                asChild
                size="sm"
                className="rounded-2xl text-xs font-bold gap-2 h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                  <span>WhatsApp Concierge</span>
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* ================= 3. APPLE-STYLE 4 TOPIC SQUIRCLE CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {productCards.map((card) => {
            const CardIcon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  setFaqCategory(card.filterTag as typeof faqCategory);
                  setActiveMainTab("faqs");
                }}
                className="group relative rounded-3xl border border-border bg-card p-6 text-left shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted/60 text-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground shadow-2xs">
                      <CardIcon className="h-6 w-6 stroke-[1.8]" />
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                        card.pillColor
                      )}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Explore articles</span>
                  <HiOutlineArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>



        {/* ================= 4. SEGMENTED TABS (Knowledge Base | Submit Ticket | Track Ticket | Escalation Matrix) ================= */}
        <div className="space-y-6">
          <div className="flex border-b border-border justify-start overflow-x-auto scrollbar-none gap-4 sm:gap-8 text-sm">
            {[
              { id: "faqs", label: "Knowledge Base & FAQs", icon: HiOutlineQuestionMarkCircle },
              { id: "ticket", label: "Submit Priority Ticket", icon: HiOutlinePaperAirplane },
              { id: "track", label: "Track Existing Ticket", icon: HiOutlineClock },
              { id: "escalation", label: "Grievance & Escalation Matrix", icon: HiOutlineScale },
            ].map((tab) => {
              const active = activeMainTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMainTab(tab.id as typeof activeMainTab)}
                  className={cn(
                    "flex items-center gap-2 pb-3.5 text-xs sm:text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ================= TAB 1: KNOWLEDGE BASE (LinkedIn Help Center Layout) ================= */}
          {activeMainTab === "faqs" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Category Navigation Filter */}
              <div className="lg:col-span-4 space-y-2.5">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Article Categories
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {filteredFaqs.length} Available
                  </span>
                </div>

                {[
                  { id: "all", label: "All Topics & Articles", count: faqs.length },
                  { id: "escrow", label: "24-Hr Escrow & Payouts", count: 2 },
                  { id: "verification", label: "DigiLocker & NMC/INC KYC", count: 1 },
                  { id: "candidate", label: "Shift Standby & Clinicians", count: 1 },
                  { id: "facility", label: "Hospital Hiring & Broadcast", count: 2 },
                ].map((cat) => {
                  const isSel = faqCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFaqCategory(cat.id as typeof faqCategory)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold text-left transition-all cursor-pointer border",
                        isSel
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-mono font-bold",
                          isSel ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}

                {/* Trust Seal Box */}
                <div className="rounded-3xl border border-border bg-muted/20 p-5 mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <HiOutlineLockClosed className="h-4 w-4 text-emerald-600" />
                    <span>RBI Nodal Escrow Protection</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    All per-diem clinician compensations are deposited into scheduled institutional escrow accounts prior to shift confirmation, eliminating non-payment risks.
                  </p>
                </div>
              </div>

              {/* Right Column: Expandable FAQ Articles */}
              <div className="lg:col-span-8 space-y-3.5">
                {filteredFaqs.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground space-y-3">
                    <HiOutlineMagnifyingGlass className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-semibold text-foreground">No articles match your search</p>
                    <p>We couldn't find any articles matching "{searchQuery}".</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setFaqCategory("all");
                      }}
                      className="rounded-xl text-xs cursor-pointer"
                    >
                      Clear search filters
                    </Button>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isOpen = openFaq === faq.id;
                    const feedback = helpfulFeedback[faq.id];
                    return (
                      <div
                        key={faq.id}
                        className="rounded-3xl border border-border bg-card overflow-hidden shadow-2xs transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                          className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer hover:bg-muted/20 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {faq.badge}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                · {faq.readTime}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                              {faq.q}
                            </h3>
                          </div>
                          <HiOutlineChevronDown
                            className={cn(
                              "h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 mt-1",
                              isOpen && "rotate-180 text-primary"
                            )}
                          />
                        </button>

                        {isOpen && (
                          <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-4 bg-muted/10 space-y-4">
                            <p>{faq.a}</p>

                            {/* Helpful Counter (Apple & LinkedIn Standard) */}
                            <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <span className="text-[11px] text-muted-foreground font-medium">
                                Was this answer helpful?
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(faq.id, "yes")}
                                  className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold border transition-all cursor-pointer",
                                    feedback === "yes"
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40"
                                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                                  )}
                                >
                                  <HiOutlineHandThumbUp className="h-3.5 w-3.5" />
                                  <span>Yes</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleFeedback(faq.id, "no")}
                                  className={cn(
                                    "flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold border transition-all cursor-pointer",
                                    feedback === "no"
                                      ? "bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40"
                                      : "bg-card text-muted-foreground border-border hover:text-foreground"
                                  )}
                                >
                                  <HiOutlineHandThumbDown className="h-3.5 w-3.5" />
                                  <span>No</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 2: SUBMIT PRIORITY TICKET (Apple Care Form) ================= */}
          {activeMainTab === "ticket" && (
            <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-6">
              <div className="border-b border-border/70 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <HiOutlinePaperAirplane className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Submit a Priority Concierge Ticket</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Target resolution SLA: Under 2 hours. Handled directly by senior clinical operations coordinators.
                    </p>
                  </div>
                </div>
              </div>

              {submittedTicket ? (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-8 text-center space-y-4">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500 text-white shadow-md">
                    <HiCheck className="h-8 w-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full mb-2">
                      <HiCheckCircle className="h-4 w-4" />
                      <span>Ticket #{submittedTicket.id} Active</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      Your Case has been Assigned to Clinical Desk
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                      Assigned to Senior Healthcare Operations Lead. An official confirmation copy and live tracking link have been dispatched to <strong className="text-foreground">{email}</strong>.
                    </p>
                  </div>

                  <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setTrackIdInput(submittedTicket.id);
                        setActiveMainTab("track");
                      }}
                      className="rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Track this Ticket
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSubmittedTicket(null);
                        setSubject("");
                        setMessage("");
                      }}
                      className="rounded-xl text-xs cursor-pointer"
                    >
                      Submit another inquiry
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
                  {/* Persona Toggle */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">I am contacting FALE as a:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserRole("candidate")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-2xl p-3.5 font-bold transition-all border cursor-pointer",
                          userRole === "candidate"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        <HiOutlineDocumentCheck className="h-4 w-4" />
                        <span>Healthcare Clinician</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserRole("facility")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-2xl p-3.5 font-bold transition-all border cursor-pointer",
                          userRole === "facility"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        <HiOutlineBuildingOffice2 className="h-4 w-4" />
                        <span>Hospital / Institution</span>
                      </button>
                    </div>
                  </div>

                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Kavitha Rajan"
                        className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground">Mobile Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {/* Email & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="kavitha@hospital.com"
                        className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground">Inquiry Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-11 rounded-xl border-input bg-card text-xs font-medium">
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verification">Clinical License & DigiLocker KYC</SelectItem>
                          <SelectItem value="shifts">Per-Diem Shift Claims & Escrow Payouts</SelectItem>
                          <SelectItem value="hiring">Hospital Shift Broadcast & Staffing</SelectItem>
                          <SelectItem value="dispute">Timesheet Dispute or Cancellation Standby</SelectItem>
                          <SelectItem value="billing">Hospital Invoices & GST Statements</SelectItem>
                          <SelectItem value="other">General Technical Assistance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Urgency Selector */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Urgency Priority</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: "standard", label: "Standard (< 4 hrs)", color: "border-border text-muted-foreground" },
                        { id: "high", label: "High (< 2 hrs)", color: "border-amber-500/40 text-amber-600 dark:text-amber-400" },
                        { id: "emergency", label: "Active Shift Urgent (Immediate)", color: "border-rose-500/40 text-rose-600 dark:text-rose-400" },
                      ].map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setUrgency(u.id as typeof urgency)}
                          className={cn(
                            "rounded-xl border p-2.5 text-center text-xs font-bold transition-all cursor-pointer",
                            urgency === u.id
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : cn("bg-muted/20 hover:bg-muted/40", u.color)
                          )}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Subject *</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Timesheet sign-off approval for Apollo ICU shift"
                      className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Description & Details *</label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please include shift ID, hospital department, or specific error message to help our clinical leads resolve this immediately."
                      className="w-full rounded-2xl border border-input bg-card p-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl text-xs font-bold h-12 gap-2 bg-primary hover:bg-primary-hover shadow-sm cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                        Logging ticket in FALE CRM…
                      </span>
                    ) : (
                      <>
                        <HiOutlinePaperAirplane className="h-4 w-4" />
                        <span>Submit Ticket to Clinical Operations</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ================= TAB 3: TRACK TICKET WITH 4-STEP VISUAL PROGRESS STEPPER (Naukri FastForward Tracker) ================= */}
          {activeMainTab === "track" && (
            <div className="max-w-3xl mx-auto rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-8">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  <HiOutlineClock className="h-3.5 w-3.5" />
                  <span>Real-time Ticket SLA Tracker</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Track Your Support Ticket</h2>
                <p className="text-xs text-muted-foreground">
                  Enter your ticket reference ID (e.g. FALE-CARE-84920) to check current milestone, assigned clinical manager, and resolution SLA.
                </p>
              </div>

              <form onSubmit={handleTrackTicket} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Ticket ID (e.g. FALE-CARE-84920)"
                  value={trackIdInput}
                  onChange={(e) => setTrackIdInput(e.target.value)}
                  className="h-12 flex-1 rounded-2xl border border-input bg-card px-4 text-xs font-mono font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase tracking-wide"
                />
                <Button type="submit" size="default" className="rounded-2xl text-xs font-bold h-12 px-6 cursor-pointer">
                  Track
                </Button>
              </form>

              {/* Quick sample ticket triggers */}
              {!trackedStatus && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-[11px] font-semibold">Try sample tickets:</span>
                  {["FALE-CARE-84920", "FALE-EMG-10492"].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setTrackIdInput(sample);
                        const isEmg = sample.includes("EMG");
                        setTrackedStatus({
                          id: sample,
                          status: isEmg ? "Active Clinical Dispatch · Level 1 Expedited" : "In Review with Senior Clinical Lead",
                          step: isEmg ? 3 : 2,
                          agent: "Dr. Kavitha Menon (Chief Healthcare Operations Lead)",
                          eta: isEmg ? "Within 15 minutes" : "Within 45 minutes",
                          type: "Clinical Credential & 24-Hr Escrow Review",
                          lastUpdate: "3 mins ago (Automated timesheet verification check)",
                        });
                      }}
                      className="rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 font-mono text-[11px] font-bold text-foreground hover:border-primary/50 cursor-pointer"
                    >
                      #{sample}
                    </button>
                  ))}
                </div>
              )}

              {trackedStatus && (
                <div className="rounded-3xl border border-border bg-muted/20 p-6 sm:p-8 space-y-6">
                  {/* Ticket Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ticket Reference</span>
                      <h3 className="font-mono font-bold text-foreground text-lg sm:text-xl">#{trackedStatus.id}</h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Status</span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {trackedStatus.status}
                      </span>
                    </div>
                  </div>

                  {/* 4-Step Visual Progress Stepper (Naukri style) */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Resolution Milestones
                    </span>
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {[
                        { step: 1, label: "Ticket Logged" },
                        { step: 2, label: "Assigned Lead" },
                        { step: 3, label: "Clinical Review" },
                        { step: 4, label: "Resolved" },
                      ].map((sItem) => {
                        const isDone = trackedStatus.step > sItem.step;
                        const isCurrent = trackedStatus.step === sItem.step;
                        return (
                          <div key={sItem.step} className="space-y-2 text-center">
                            <div className="relative">
                              <div
                                className={cn(
                                  "h-2 rounded-full transition-all",
                                  isDone
                                    ? "bg-emerald-500"
                                    : isCurrent
                                    ? "bg-primary animate-pulse"
                                    : "bg-muted"
                                )}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-[11px] font-bold block",
                                isDone
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : isCurrent
                                  ? "text-primary font-black"
                                  : "text-muted-foreground"
                              )}
                            >
                              {sItem.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ticket Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assigned Lead</span>
                      <strong className="text-foreground text-sm block">{trackedStatus.agent}</strong>
                      <span className="text-[11px] text-muted-foreground">Verified FALE Clinical Supervisor</span>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Guaranteed SLA</span>
                      <strong className="text-primary text-sm font-bold block">{trackedStatus.eta}</strong>
                      <span className="text-[11px] text-muted-foreground">{trackedStatus.lastUpdate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>Need to escalate this case?</span>
                    <button
                      type="button"
                      onClick={() => setActiveMainTab("escalation")}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      View Escalation Matrix →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 4: GRIEVANCE & ESCALATION MATRIX (Naukri / Enterprise Compliance) ================= */}
          {activeMainTab === "escalation" && (
            <div className="max-w-4xl mx-auto rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-8">
              <div className="space-y-1.5 border-b border-border/70 pb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  <HiOutlineScale className="h-3.5 w-3.5" />
                  <span>Institutional Redressal Mechanism</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Clinical Grievance & Escalation Matrix</h2>
                <p className="text-xs text-muted-foreground">
                  FALE adheres to transparent healthcare staffing standards. If an issue is not resolved within the defined turnaround time, it can be escalated across our hierarchical matrix.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    level: "Level 1: Frontline Operations Desk",
                    role: "Shift Coordinators & Credential Verification Desk",
                    tat: "SLA: Within 2 Hours",
                    contact: `${SUPPORT_EMAIL} · ${SUPPORT_PHONE}`,
                    desc: "Handles timesheet sign-offs, per-diem payment status, DigiLocker KYC issues, and standby fee approvals.",
                  },
                  {
                    level: "Level 2: Clinical Grievance Redressal Officer",
                    role: "Dr. Ananya Sundaram (Head of Quality & Compliance)",
                    tat: "SLA: Within 24 Hours",
                    contact: "grievance@thefale.com · Desk Extension: #104",
                    desc: "Handles hospital contractual disagreements, clinician conduct disputes, and ICU/OT ratio compliance concerns.",
                  },
                  {
                    level: "Level 3: Principal Nodal Officer",
                    role: "Arjun Verma (Nodal Officer for Institutional Escrows & Regulatory Compliance)",
                    tat: "SLA: Within 48 Hours",
                    contact: "nodal.officer@thefale.com",
                    desc: "Statutory escalation for RBI nodal banking settlement questions, institutional audits, and legal notices.",
                  },
                ].map((tier, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-muted/20 p-5 space-y-2 text-xs transition-all hover:bg-muted/30"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-foreground text-sm">{tier.level}</h3>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 w-fit">
                        {tier.tat}
                      </span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed pt-1">
                      {tier.desc}
                    </p>

                    <div className="flex flex-wrap items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/40">
                      <span><strong>Responsible Lead:</strong> {tier.role}</span>
                      <span className="font-mono text-primary font-semibold">{tier.contact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= 5. ACTIVE SHIFT SOS LIFELINE ================= */}
        <div className="rounded-3xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <HiOutlineExclamationTriangle className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Currently on duty at a hospital and facing an emergency?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  For immediate incident reporting, patient safety disputes, or emergency duty cover, call our 24/7 Clinical Emergency Line.
                </p>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="rounded-2xl text-xs font-bold gap-2 h-11 px-5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs shrink-0 cursor-pointer"
            >
              <a href={`tel:${SUPPORT_PHONE_RAW}`}>
                <HiOutlinePhone className="h-4 w-4" />
                <span>Call Emergency Desk: {SUPPORT_PHONE}</span>
              </a>
            </Button>
          </div>
        </div>

        {/* ================= 6. LINKEDIN ENTERPRISE TRUST & REGIONAL CENTERS ================= */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="space-y-2 pr-0 md:pr-4">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <HiOutlineMapPin className="h-4 w-4 text-primary" />
                <span>Bengaluru Innovation Hub</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                RMZ Ecoworld, Tower 4B, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103
              </p>
              <span className="text-[11px] text-muted-foreground font-medium block">
                Verification Counter: Mon – Fri (10 AM – 6 PM)
              </span>
            </div>

            <div className="space-y-2 pt-4 md:pt-0 px-0 md:px-4">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <HiOutlineMapPin className="h-4 w-4 text-emerald-600" />
                <span>Chennai Operations Desk</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Olympia Technology Park, Level 3, Guindy, Chennai, Tamil Nadu 600032
              </p>
              <span className="text-[11px] text-muted-foreground font-medium block">
                Verification Counter: Mon – Fri (10 AM – 6 PM)
              </span>
            </div>

            <div className="space-y-2 pt-4 md:pt-0 pl-0 md:pl-4">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                <span>Regulatory Standards</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                RBI Nodal Escrow Banking Mandates · National Health Authority (ABHA) API Integration · ISO 27001 Certified Clinical Data Vault.
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                100% Verified Clinical Network
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
