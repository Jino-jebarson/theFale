import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlinePencilSquare,
  HiOutlineArrowDownTray,
  HiOutlineBolt,
  HiOutlineBuildingOffice2,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentDuplicate,
  HiOutlineCheck,
  HiOutlineCurrencyRupee,
  HiOutlineArrowTrendingUp,
  HiOutlineCalendarDays,
  HiOutlineLockClosed,
  HiOutlineInformationCircle,
  HiOutlineBuildingLibrary,
  HiOutlinePrinter,
  HiOutlineDocumentCheck,
} from "react-icons/hi2";
import { toast } from "sonner";
import { Logo } from "@/components/fale/Logo";
import { AppShell } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, setState, type CandidatePayoutMethod, type CandidatePayoutTransaction } from "@/lib/store";
import { generatePayoutAdvicePdf, printPayoutAdvicePdf } from "@/lib/payoutSlipPdf";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings & 24-hr Payouts — FALE Healthcare" },
      {
        name: "description",
        content: "Track clinical shift earnings, 24-hr escrow guarantee payouts, and manage your verified Cashfree UPI / bank payout destination.",
      },
    ],
  }),
  component: CandidateEarningsPage,
});

const mockTdsRecords = [
  { id: "TDS-2026-Q3-01", period: "Oct 2026", gross: 24200, tdsRate: "10% (Sec 194J)", tdsAmount: 2420, netCredited: 21780, status: "Deposited to TRACES" },
  { id: "TDS-2026-Q2-02", period: "Sep 2026", gross: 19800, tdsRate: "10% (Sec 194J)", tdsAmount: 1980, netCredited: 17820, status: "Deposited to TRACES" },
  { id: "TDS-2026-Q2-01", period: "Aug 2026", gross: 14500, tdsRate: "10% (Sec 194J)", tdsAmount: 1450, netCredited: 13050, status: "Deposited to TRACES" },
];

function amountInWords(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (!num || num === 0) return "Rupees Zero Only";

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
  }

  return `Rupees ${inWords(Math.floor(num)).trim()} Only`;
}

function CandidateEarningsPage() {
  const store = useApp();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "tds">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedSlipTx, setSelectedSlipTx] = useState<CandidatePayoutTransaction | null>(null);

  const candidateName = String(store.profile["name"] || "Jino Jebarson R");
  const candidatePayoutMethod: CandidatePayoutMethod = store.candidatePayoutMethod || {
    type: "upi",
    upiId: "jinovj250@oksbi",
    accountHolderName: candidateName,
    status: "Verified",
    verifiedAt: "Cashfree Instant VPA Validated",
  };

  const payouts: CandidatePayoutTransaction[] = store.candidatePayouts || [];

  // Payout Form Modal State
  const [payoutType, setPayoutType] = useState<"upi" | "bank">(candidatePayoutMethod.type);
  const [formUpiId, setFormUpiId] = useState(candidatePayoutMethod.upiId || "jinovj250@oksbi");
  const [formHolderName, setFormHolderName] = useState(candidatePayoutMethod.accountHolderName || candidateName);
  const [formBankName, setFormBankName] = useState(candidatePayoutMethod.bankName || "HDFC Bank Ltd");
  const [formAccNumber, setFormAccNumber] = useState(candidatePayoutMethod.accountNumber || "50100412891234");
  const [formConfirmAcc, setFormConfirmAcc] = useState(candidatePayoutMethod.accountNumber || "50100412891234");
  const [formIfsc, setFormIfsc] = useState(candidatePayoutMethod.ifsc || "HDFC0000060");
  const [isVerifying, setIsVerifying] = useState(false);

  // Financial Telemetry
  const totalDisbursed = useMemo(() => {
    return payouts
      .filter((p) => p.status === "Disbursed")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payouts]);

  const inEscrowAmount = useMemo(() => {
    return payouts
      .filter((p) => p.status === "In Escrow (24h SLA)")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payouts]);

  const filteredPayouts = useMemo(() => {
    let list = payouts;
    if (activeTab === "pending") {
      list = list.filter((p) => p.status === "In Escrow (24h SLA)");
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.shiftTitle.toLowerCase().includes(q) ||
        p.hospitalName.toLowerCase().includes(q) ||
        p.dept.toLowerCase().includes(q) ||
        (p.utr && p.utr.toLowerCase().includes(q))
    );
  }, [payouts, activeTab, searchQuery]);

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSavePayoutMethod = (e: React.FormEvent) => {
    e.preventDefault();

    if (payoutType === "upi") {
      if (!formUpiId || !formUpiId.includes("@")) {
        toast.error("Please enter a valid UPI ID (e.g. name@okhdfcbank)");
        return;
      }
    } else {
      if (!formAccNumber || formAccNumber.length < 8) {
        toast.error("Please enter a valid bank account number");
        return;
      }
      if (formAccNumber !== formConfirmAcc) {
        toast.error("Account numbers do not match");
        return;
      }
      if (!formIfsc || formIfsc.length < 11) {
        toast.error("Please enter a valid 11-digit IFSC code");
        return;
      }
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);

      const updated: CandidatePayoutMethod = {
        type: payoutType,
        upiId: payoutType === "upi" ? formUpiId.toLowerCase() : undefined,
        accountNumber: payoutType === "bank" ? formAccNumber : undefined,
        ifsc: payoutType === "bank" ? formIfsc.toUpperCase() : undefined,
        bankName: payoutType === "bank" ? formBankName : undefined,
        accountHolderName: formHolderName,
        status: "Verified",
        verifiedAt: payoutType === "upi" ? "Cashfree Instant VPA Validated" : "Cashfree ₹1 Penny Drop Validated",
      };

      setState(() => ({
        candidatePayoutMethod: updated,
      }));

      setPayoutModalOpen(false);
      toast.success(
        payoutType === "upi"
          ? "UPI ID verified via Cashfree VPA!"
          : "Bank Account verified via Cashfree Penny Drop!",
        {
          description: `All future 24-hr shift payouts will be sent to ${payoutType === "upi" ? formUpiId : formBankName}.`,
        }
      );
    }, 1000);
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-16 min-w-0">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Earnings &amp; 24-Hour Payouts
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Guaranteed shift remuneration, automated Cashfree disbursements, and tax slips for {candidateName}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold h-9 px-3.5 cursor-pointer gap-1.5"
            >
              <Link to="/shifts">
                <HiOutlineBolt className="h-4 w-4 text-primary" />
                <span>Find Shifts</span>
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={() => setPayoutModalOpen(true)}
              className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs"
            >
              <HiOutlinePencilSquare className="h-4 w-4" />
              <span>Update Payout Account</span>
            </Button>
          </div>
        </div>

        {/* 4 Telemetry Balance Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Total Disbursed */}
          <div className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <HiOutlineBanknotes className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                100% on-time
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block truncate">
                Disbursed Earnings
              </span>
              <div className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
                ₹{totalDisbursed.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                Received in bank / UPI
              </p>
            </div>
          </div>

          {/* Card 2: In Escrow (24h SLA) */}
          <div className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <HiOutlineLockClosed className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                Releasing &lt; 24h
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block truncate">
                In 24-hr Escrow
              </span>
              <div className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
                ₹{inEscrowAmount.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                From tonight's duty
              </p>
            </div>
          </div>

          {/* Card 3: This Month Take-Home */}
          <div className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <HiOutlineArrowTrendingUp className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                Oct 2026
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block truncate">
                This Month's Earnings
              </span>
              <div className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
                ₹{(totalDisbursed + inEscrowAmount).toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                Gross locum earnings
              </p>
            </div>
          </div>

          {/* Card 4: Completed Duties */}
          <div className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <HiOutlineClock className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                Verified Cover
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground block truncate">
                Completed Duties
              </span>
              <div className="text-lg sm:text-2xl font-bold font-mono tracking-tight text-foreground mt-1">
                {payouts.length} Shifts
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                Zero payment disputes
              </p>
            </div>
          </div>
        </section>

        {/* Active Payout Destination Strip */}
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <HiOutlineCheckBadge className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-foreground block truncate">
                      Active Cashfree 24-Hour Payout Destination
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {candidatePayoutMethod.type === "upi" ? "Instant 24x7 UPI Remittance" : "Direct Commercial Bank Mandate"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  {candidatePayoutMethod.verifiedAt || "Cashfree VPA Validated"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-0.5 leading-relaxed">
                Funds are automatically disbursed by FALE Escrow within 24 hours of timesheet verification.
              </p>
            </div>

            {/* Unified Destination Detail Box & Action */}
            <div className="bg-muted/40 p-3 sm:py-2.5 sm:px-3.5 rounded-xl border border-border/70 text-xs flex items-center justify-between gap-3.5 w-full lg:w-auto min-w-0 sm:min-w-[320px] shadow-2xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                    {candidatePayoutMethod.type === "upi" ? "Verified UPI ID" : `${candidatePayoutMethod.bankName}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(candidatePayoutMethod.type === "upi" ? candidatePayoutMethod.upiId! : candidatePayoutMethod.accountNumber!, "payout", "Payout destination")}
                    className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0 transition-colors p-0.5"
                    title="Copy details"
                  >
                    {copiedKey === "payout" ? <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-600" /> : <HiOutlineDocumentDuplicate className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="font-mono font-bold text-foreground truncate mt-0.5 text-xs sm:text-sm">
                  {candidatePayoutMethod.type === "upi"
                    ? candidatePayoutMethod.upiId
                    : `•••• •••• ${candidatePayoutMethod.accountNumber?.slice(-4)} (${candidatePayoutMethod.ifsc})`}
                </div>
                <span className="text-[10px] text-muted-foreground/80 block mt-0.5 truncate">
                  Matched Name: {candidatePayoutMethod.accountHolderName}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPayoutModalOpen(true)}
                className="rounded-lg text-xs font-semibold h-8.5 px-3 shrink-0 cursor-pointer border-primary/40 text-primary hover:bg-primary hover:text-white transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                <span>Change</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Ledger & Statements */}
        <section className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab Pills with Smooth Horizontal Mobile Scroll */}
            <div className="w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0 -mx-1 px-1">
              <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/60 min-w-max">
                {[
                  { id: "all", label: "All Shift Payouts" },
                  { id: "pending", label: "In Escrow (24h SLA)" },
                  { id: "tds", label: "TDS & Tax Slips" },
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
                      activeTab === tab.id
                        ? "bg-card text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.id === "pending" && inEscrowAmount > 0 && (
                      <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded-full font-bold">
                        1 Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            {activeTab !== "tds" && (
              <div className="relative w-full sm:w-60 shrink-0">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter shift, hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8.5 w-full rounded-xl border border-input bg-card pl-8 pr-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Payouts Ledger Table */}
          {activeTab !== "tds" && (
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs min-w-[680px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Shift Date</th>
                    <th className="py-3 px-4">Role &amp; Facility</th>
                    <th className="py-3 px-4">Duration &amp; Rate</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Disbursed Via</th>
                    <th className="py-3 px-4 text-right">Net Remuneration</th>
                    <th className="py-3 px-4 text-right">Advice Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        No shift payouts found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPayouts.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-medium">
                          {tx.shiftDate}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{tx.shiftTitle}</div>
                          <div className="text-[11px] text-muted-foreground">{tx.hospitalName} · {tx.dept}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          <div>{tx.hours} hrs @ ₹{tx.rate}/hr</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                              tx.status === "Disbursed"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            )}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-[11px] text-muted-foreground font-mono">
                          <div>{tx.payoutMethodUsed}</div>
                          {tx.utr && <div className="text-[10px] text-muted-foreground/70">UTR: {tx.utr}</div>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-sm text-foreground">
                          ₹{tx.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSlipTx(tx)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-primary hover:bg-primary/10 font-bold transition-all cursor-pointer"
                            title="View & Print Payout Advice Slip"
                          >
                            <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: TDS & Form 16A Summaries */}
          {activeTab === "tds" && (
            <div>
              <div className="px-4 py-3 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>TDS applicable under <strong>Section 194J</strong> (Professional Healthcare Cover). Annual summary available for ITR filing.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast.success("Consolidated Form 16A summary scheduled for email delivery.")}
                  className="h-7 text-xs text-primary font-semibold hover:bg-muted cursor-pointer"
                >
                  Email Form 16A Summary
                </Button>
              </div>

              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Statement #</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4 text-right">Gross Earnings</th>
                      <th className="py-3 px-4 text-right">TDS Section</th>
                      <th className="py-3 px-4 text-right">TDS Deducted</th>
                      <th className="py-3 px-4 text-right">Net Received</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {mockTdsRecords.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-foreground">
                          {t.id}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-medium">
                          {t.period}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-muted-foreground">
                          ₹{t.gross.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-medium text-foreground">
                          {t.tdsRate}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-destructive">
                          -₹{t.tdsAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-foreground">
                          ₹{t.netCredited.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => toast.success(`Downloading TDS statement ${t.id}...`)}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
                          >
                            <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* MODAL: Update Payout Method (UPI or Bank Account) */}
      <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[88vh] flex flex-col rounded-2xl border-border/80 shadow-lg">
          {/* Fixed Header */}
          <DialogHeader className="p-5 border-b border-border/60 shrink-0 text-left space-y-1 bg-card">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <HiOutlineBanknotes className="h-4.5 w-4.5" />
              </span>
              <DialogTitle className="text-lg font-bold text-foreground">
                24-Hour Payout Destination
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure your verified UPI ID or Bank Account for automated Cashfree shift earnings.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSavePayoutMethod} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto scrollbar-none p-5 space-y-4 flex-1">
              {/* Type Switcher with Stacked Mobile-Friendly Cards */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Choose Payout Method</label>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPayoutType("upi")}
                    className={cn(
                      "p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3",
                      payoutType === "upi"
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-2xs"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        payoutType === "upi" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <HiOutlineBolt className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">Instant UPI</span>
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                            Fastest · 24×7
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5 truncate">
                          GPay, PhonePe, Paytm, BHIM, Cred
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all",
                      payoutType === "upi" ? "border-primary bg-primary text-white" : "border-muted-foreground/40"
                    )}>
                      {payoutType === "upi" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutType("bank")}
                    className={cn(
                      "p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3",
                      payoutType === "bank"
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-2xs"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        payoutType === "bank" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <HiOutlineBuildingLibrary className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">Bank Account</span>
                          <span className="text-[10px] bg-muted text-muted-foreground font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                            Direct IMPS / NEFT
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5 truncate">
                          Direct transfer to any verified savings or current account
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all",
                      payoutType === "bank" ? "border-primary bg-primary text-white" : "border-muted-foreground/40"
                    )}>
                      {payoutType === "bank" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Account Holder Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formHolderName}
                  onChange={(e) => setFormHolderName(e.target.value)}
                  placeholder="e.g. Dr. Jino Jebarson R"
                  className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <p className="text-[10px] text-muted-foreground">
                  Must match the name on your State Medical / Nursing Council registration.
                </p>
              </div>

              {/* UPI Fields */}
              {payoutType === "upi" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Virtual Payment Address (UPI ID) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUpiId}
                    onChange={(e) => setFormUpiId(e.target.value)}
                    placeholder="e.g. jino@okhdfcbank or 9845012345@paytm"
                    className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Cashfree will perform an instant VPA check to verify account holder match.
                  </p>
                </div>
              )}

              {/* Bank Account Fields */}
              {payoutType === "bank" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Bank Name <span className="text-destructive">*</span>
                    </label>
                    <Select value={formBankName} onValueChange={setFormBankName}>
                      <SelectTrigger className="h-9.5 rounded-xl border-input bg-card px-3 text-xs font-medium">
                        <SelectValue placeholder="Select Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HDFC Bank Ltd" className="text-xs">HDFC Bank Ltd</SelectItem>
                        <SelectItem value="State Bank of India" className="text-xs">State Bank of India</SelectItem>
                        <SelectItem value="ICICI Bank" className="text-xs">ICICI Bank</SelectItem>
                        <SelectItem value="Axis Bank" className="text-xs">Axis Bank</SelectItem>
                        <SelectItem value="Kotak Mahindra Bank" className="text-xs">Kotak Mahindra Bank</SelectItem>
                        <SelectItem value="Punjab National Bank" className="text-xs">Punjab National Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Account Number <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formAccNumber}
                        onChange={(e) => setFormAccNumber(e.target.value)}
                        placeholder="50100412891234"
                        className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Confirm Number <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formConfirmAcc}
                        onChange={(e) => setFormConfirmAcc(e.target.value)}
                        placeholder="Re-enter number"
                        className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      IFSC Code <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formIfsc}
                      onChange={(e) => setFormIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0000060"
                      className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </div>
              )}

              {/* Cashfree Guarantee Note */}
              <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
                  <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                  <span>24-Hour Payout Guarantee</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  Upon clocking out and timesheet approval by the hospital supervisor, funds held in FALE Escrow are instantly transferred to this verified account.
                </p>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-4 border-t border-border/60 bg-muted/20 shrink-0 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPayoutModalOpen(false)}
                className="rounded-xl text-xs font-medium h-9 px-3.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isVerifying}
                className="rounded-xl text-xs font-semibold h-9 px-4.5 cursor-pointer bg-primary hover:bg-primary-hover shadow-2xs gap-1.5"
              >
                {isVerifying ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Validating with Cashfree...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="h-4 w-4" />
                    <span>Verify &amp; Save Payout</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Stylesheet for Official Payout Advice Slip */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          /* Hide app shell and background completely from print layout */
          #root, body > div:not([data-radix-portal]), [data-radix-portal] > div:first-child {
            display: none !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          [data-radix-portal] {
            position: static !important;
            display: block !important;
          }

          /* Reset dialog frame to normal unclipped block flow */
          div[role="dialog"] {
            position: static !important;
            inset: auto !important;
            transform: none !important;
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            background: transparent !important;
          }

          /* Hide modal close button and all screen toolbars */
          .print\\:hidden, button[aria-label="Close"], button {
            display: none !important;
          }

          /* Clean 1-page printable slip layout */
          #payout-slip-printable {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 20px !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 12px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #payout-slip-printable * {
            color: #0f172a !important;
            border-color: #e2e8f0 !important;
          }

          #payout-slip-printable .bg-card,
          #payout-slip-printable .bg-muted\\/20,
          #payout-slip-printable .bg-muted\\/30,
          #payout-slip-printable .bg-muted\\/40 {
            background-color: #f8fafc !important;
          }

          #payout-slip-printable .text-primary {
            color: #ea580c !important;
          }

          #payout-slip-printable .text-muted-foreground {
            color: #64748b !important;
          }

          #payout-slip-printable .bg-primary {
            background-color: #ea580c !important;
            color: #ffffff !important;
          }
        }
      `}</style>

      {/* MODAL: Printable Payout Advice Slip with Official Logo */}
      <Dialog open={!!selectedSlipTx} onOpenChange={(open) => !open && setSelectedSlipTx(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden max-h-[92vh] flex flex-col rounded-2xl border-border/80 shadow-2xl bg-background">
          {/* Top Toolbar (Hidden when printing) */}
          <div className="py-3 px-4 sm:px-6 pr-12 border-b border-border/60 bg-muted/40 flex items-center justify-between shrink-0 print:hidden min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl bg-primary/10 text-primary shrink-0">
                <HiOutlineDocumentCheck className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  Payout Advice Slip
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono truncate block">
                  Ref: {selectedSlipTx?.slipRef}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Document Container */}
          <div className="overflow-y-auto scrollbar-none p-3 sm:p-6 flex-1 bg-muted/15">
            {selectedSlipTx && (
              <div
                id="payout-slip-printable"
                className="bg-card text-foreground rounded-2xl border border-border/80 p-5 sm:p-8 shadow-xs space-y-6 max-w-2xl mx-auto"
              >
                {/* 1. Header with Official Logo & Platform Identity */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/80 pb-5">
                  <div className="space-y-1">
                    <Logo />
                    <div className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                      <p className="font-bold text-foreground/90">THE FALE HEALTHCARE PRIVATE LIMITED</p>
                      <p>Healthcare Staffing &amp; 24-Hour Nodal Escrow Platform</p>
                      <p>CIN: U85100KA2025PTC189210 · GSTIN: 29AABCT1234F1Z5</p>
                      <p>Bengaluru, Karnataka - 560001 · support@thefale.com</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1 shrink-0">
                    <span className="inline-block text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      PAYOUT ADVICE SLIP
                    </span>
                    <div className="font-mono text-xs font-bold text-foreground mt-1">
                      {selectedSlipTx.slipRef}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Disbursal Date: <span className="font-medium text-foreground">{selectedSlipTx.payoutDate}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Settlement Route: <span className="font-medium text-foreground">Cashfree Nodal Escrow</span>
                    </p>
                  </div>
                </div>

                {/* 2. Settlement Status Banner */}
                <div className={cn(
                  "p-3.5 rounded-xl border flex items-center justify-between flex-wrap gap-3 text-xs",
                  selectedSlipTx.status === "Disbursed"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                )}>
                  <div className="flex items-start gap-2.5">
                    {selectedSlipTx.status === "Disbursed" ? (
                      <HiOutlineCheckBadge className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    ) : (
                      <HiOutlineClock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block text-xs tracking-wide">
                        {selectedSlipTx.status === "Disbursed"
                          ? "PAYMENT SETTLED & DISBURSED"
                          : "FUNDS HELD IN 24-HOUR ESCROW"}
                      </span>
                      <span className="text-[11px] opacity-85 block mt-0.5">
                        {selectedSlipTx.status === "Disbursed"
                          ? "Timesheet verified by hospital supervisor • Remuneration transferred to candidate."
                          : "Shift verified by hospital • Scheduled for automatic bank transfer within 24 hours."}
                      </span>
                    </div>
                  </div>
                  {selectedSlipTx.utr ? (
                    <div className="font-mono text-[11px] bg-background/90 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 shadow-xs">
                      <span className="text-muted-foreground font-semibold">UTR: </span>
                      <span className="font-bold">{selectedSlipTx.utr}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-semibold uppercase tracking-wider bg-background/80 px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-700 dark:text-amber-300">
                      24h Escrow SLA
                    </div>
                  )}
                </div>

                {/* 3. Beneficiary & Hospital Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-border/70 rounded-xl p-4 bg-muted/20">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Beneficiary Healthcare Professional
                    </p>
                    <div className="font-bold text-sm text-foreground">{candidateName}</div>
                    <div className="space-y-0.5 text-[11px] text-muted-foreground">
                      <p><span className="text-foreground font-medium">Council Reg. #:</span> {String(store.profile["regNumber"] || "TNMC-84912 / KMC-99124")}</p>
                      <p><span className="text-foreground font-medium">Designation:</span> {selectedSlipTx.shiftTitle.split(" - ")[0] || "Registered Clinician"}</p>
                      <p><span className="text-foreground font-medium">Credited To:</span> <span className="font-mono text-foreground">{selectedSlipTx.payoutMethodUsed}</span></p>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-border/70 pt-3 sm:pt-0 sm:pl-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Duty Hospital &amp; Department
                    </p>
                    <div className="font-bold text-sm text-foreground">{selectedSlipTx.hospitalName}</div>
                    <div className="space-y-0.5 text-[11px] text-muted-foreground">
                      <p><span className="text-foreground font-medium">Department:</span> {selectedSlipTx.dept}</p>
                      <p><span className="text-foreground font-medium">Duty Slot:</span> {selectedSlipTx.shiftDate}</p>
                      <p><span className="text-foreground font-medium">Duty Hours:</span> {selectedSlipTx.hours} Hours (@ ₹{selectedSlipTx.rate}/hr)</p>
                    </div>
                  </div>
                </div>

                {/* 4. Itemized Remuneration Statement */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Itemized Remuneration Statement
                  </p>

                  {/* Mobile Uncramped Card Breakdown (Visible on Phone Screens) */}
                  <div className="sm:hidden print:hidden space-y-2">
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-border/60">
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-foreground block">
                            Clinical Shift Base Remuneration
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {selectedSlipTx.shiftTitle} ({selectedSlipTx.dept})
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-primary block mt-1">
                            {selectedSlipTx.hours} hrs × ₹{selectedSlipTx.rate.toLocaleString("en-IN")}/hr
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-foreground shrink-0">
                          ₹{(selectedSlipTx.hours * selectedSlipTx.rate).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Night / ICU Differential</span>
                        <span className="font-mono">₹0.00</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>FALE Platform Fee (Candidate)</span>
                        <span className="text-emerald-600 font-semibold">100% Free</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>TDS Withholding (Sec 194J)</span>
                        <span className="font-mono">₹0.00 (Exempt)</span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t-2 border-border/80 text-xs">
                        <span className="font-bold text-foreground">Net Disbursed Remuneration</span>
                        <span className="font-mono font-black text-sm text-primary">
                          ₹{selectedSlipTx.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop & Printable Table View */}
                  <div className="hidden sm:block print:block rounded-xl border border-border/80 overflow-x-auto scrollbar-none text-xs">
                    <table className="w-full text-left min-w-[480px]">
                      <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground font-semibold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-center">Hours / Units</th>
                          <th className="py-2.5 px-3 text-right">Agreed Rate</th>
                          <th className="py-2.5 px-3 text-right">Gross Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-foreground">Clinical Shift Base Remuneration</span>
                            <span className="text-[10px] text-muted-foreground block">
                              {selectedSlipTx.shiftTitle} ({selectedSlipTx.dept})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                            {selectedSlipTx.hours} hrs
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            ₹{selectedSlipTx.rate.toLocaleString("en-IN")} / hr
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                            ₹{(selectedSlipTx.hours * selectedSlipTx.rate).toLocaleString("en-IN")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">
                            Night Duty / ICU Differential Allowance
                          </td>
                          <td className="py-2 px-3 text-center text-muted-foreground font-mono">-</td>
                          <td className="py-2 px-3 text-right text-muted-foreground font-mono">-</td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">₹0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">
                            FALE Platform Convenience Fee (Candidate)
                          </td>
                          <td className="py-2 px-3 text-center text-muted-foreground font-mono">-</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-semibold">100% Free</td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">₹0.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">
                            TDS Withholding (Section 194J - Professional Services)
                          </td>
                          <td className="py-2 px-3 text-center text-muted-foreground font-mono">-</td>
                          <td className="py-2 px-3 text-right text-muted-foreground font-mono">Exempt / Threshold</td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">₹0.00</td>
                        </tr>
                      </tbody>
                      <tfoot className="border-t-2 border-border/80 bg-muted/30">
                        <tr>
                          <td colSpan={3} className="py-3 px-3 font-bold text-sm text-foreground">
                            Net Disbursed Professional Remuneration
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-base text-primary">
                            ₹{selectedSlipTx.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Amount in words */}
                  <div className="px-3 py-2 rounded-lg bg-muted/20 border border-border/60 text-[11px] flex items-center justify-between flex-wrap gap-2">
                    <span className="text-muted-foreground">Amount in words:</span>
                    <span className="font-bold text-foreground italic">{amountInWords(selectedSlipTx.amount)}</span>
                  </div>
                </div>

                {/* 5. Escrow Settlement Telemetry */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-border/70 pt-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Payout Partner</span>
                    <span className="font-bold text-foreground">Cashfree AutoPayouts</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Escrow Nodal A/C</span>
                    <span className="font-mono font-medium text-foreground">FALE-NODAL-01</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Disbursal Mode</span>
                    <span className="font-medium text-foreground">Instant IMPS / UPI 24x7</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Timesheet Sign-off</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Verified &amp; Approved</span>
                  </div>
                </div>

                {/* 6. Footer Disclaimer & Digital Signature */}
                <div className="border-t border-border/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-muted-foreground leading-relaxed">
                  <div className="max-w-md text-left">
                    <p className="font-medium text-foreground/80">Compliance &amp; Legal Validity Note:</p>
                    <p>
                      This is an electronically generated Remuneration Advice Slip issued in accordance with RBI Nodal Escrow Regulations and Section 194J of the Income Tax Act, 1961. It constitutes valid proof of locum engagement and professional receipt.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl border border-primary/20 bg-primary/5 shrink-0 text-left">
                    <HiOutlineShieldCheck className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block text-[11px]">FALE ESCROW SECURE</span>
                      <span className="text-[9px] text-muted-foreground block">Cryptographically Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Sticky Action Bar (Hidden when printing) */}
          <div className="p-3.5 px-4 sm:px-6 border-t border-border/60 bg-card flex items-center justify-between gap-3 shrink-0 print:hidden">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Official Locum Payout Advice · FALE Nodal Escrow SLA
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedSlipTx(null)}
                className="h-9 rounded-xl text-xs font-semibold px-3.5 cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedSlipTx) {
                    printPayoutAdvicePdf(selectedSlipTx, candidateName, String(store.profile["regNumber"] || "TNMC-84912 / KMC-99124"));
                  }
                }}
                className="h-9 rounded-xl text-xs font-semibold gap-1.5 px-3.5 cursor-pointer hidden sm:flex"
              >
                <HiOutlinePrinter className="h-3.5 w-3.5 shrink-0" />
                <span>Print</span>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedSlipTx) {
                    generatePayoutAdvicePdf(selectedSlipTx, candidateName, String(store.profile["regNumber"] || "TNMC-84912 / KMC-99124"));
                    toast.success("Payout Advice PDF downloaded successfully!");
                  }
                }}
                className="h-9 rounded-xl text-xs font-bold gap-1.5 px-4 cursor-pointer bg-primary hover:bg-primary-hover text-white shadow-2xs flex-1 sm:flex-initial"
              >
                <HiOutlineArrowDownTray className="h-4 w-4 shrink-0" />
                <span>Download PDF Receipt</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
