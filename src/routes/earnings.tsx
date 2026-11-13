import { amountInWords } from "@/lib/amountInWords";
import { toEarning } from "@/lib/earningsModel";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { copyText } from "@/lib/copyText";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useMemo, useEffect } from "react";
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
  HiOutlineAcademicCap,
  HiOutlineXMark,
  HiOutlinePlus,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { toast } from "sonner";
import { Logo } from "@/components/fale/Logo";
import { AppShell, PageHead } from "@/components/fale/AppShell";
import { StudentLockCard } from "@/components/fale/StudentLockCard";
import { EmptyEarningsGraphic } from "@/components/fale/EmptyEarningsGraphic";
import { Button, ButtonSpinner } from "@/components/ui/button";
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
import { generatePayoutAdvicePdf, printPayoutAdvicePdf, type PayoutAdviceRecord } from "@/lib/payoutSlipPdf";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees } from "@/lib/api";
import { getMyClaims, getPayoutAdvice, type ShiftClaimDto } from "@/lib/adapters/shiftAdapter";
import { getCandidateProfile, savePayoutMethod as apiSavePayoutMethod, getPayoutMethod } from "@/lib/adapters/candidateAdapter";

export interface UiPayoutTransaction extends PayoutAdviceRecord {
  shiftId?: string | undefined; rawClaim: ShiftClaimDto; adviceAvailable: boolean; amountsRecorded: boolean;
}
function toUiPayout(c: ShiftClaimDto): UiPayoutTransaction {
  const item=toEarning(c), paid=item.state === "paid";
  const status=paid ? "Disbursed" : item.state === "pending" ? "Pending Payout" : item.state === "frozen" ? "Disputed (Frozen)" : item.state === "closed" ? "Cancelled" : "In Escrow";
  const date=(value?:string) => value ? new Date(value).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}) + " IST" : "Not recorded";
  return { id:c.id,shiftId:c.shiftId,shiftTitle:c.shiftTitle || "Title not recorded",hospitalName:c.facilityName || "Hospital not recorded",dept:c.shiftDepartment || c.department || "Not recorded",
    shiftDate:date(c.startAt),hours:item.hours,rate:item.hours ? item.gross/item.hours : 0,amount:item.net,
    grossAmount:item.amountsRecorded ? item.gross : undefined,platformFee:item.amountsRecorded ? item.fee : undefined,tdsAmount:item.amountsRecorded ? item.tds : undefined,
    payoutDate:paid ? date(c.disbursedAt) : item.label,status,payoutMethodUsed:c.payoutMethodSnapshot || "Historical destination not recorded",utr:c.utr,slipRef:c.payoutSlipRef || c.id,
    rawClaim:c,adviceAvailable:item.adviceAvailable,amountsRecorded:item.amountsRecorded };
}
export const Route = createFileRoute("/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings & Payouts — FALE Healthcare" },
      {
        name: "description",
        content: "Track saved clinical shift earnings, recorded payments and payout details.",
      },
    ],
  }),
  component: CandidateEarningsPage,
});


function formatMobilePayoutMethod(method: string): string {
  if (!method) return "Not recorded";
  if (method.startsWith("Cashfree Direct Bank · ")) {
    return method.replace("Cashfree Direct Bank · ", "");
  }
  if (method.startsWith("Cashfree Instant UPI · ")) {
    return method.replace("Cashfree Instant UPI · ", "UPI: ");
  }
  if (method.startsWith("Cashfree Direct UPI · ")) {
    return method.replace("Cashfree Direct UPI · ", "UPI: ");
  }
  if (method.includes(" · ")) {
    return method.split(" · ").slice(1).join(" · ");
  }
  return method;
}

function CandidateEarningsPage() {
  const pageLoad = usePageLoad();
  const action = useConfirmedAction();
  const [loadedMethod,setLoadedMethod]=useState<CandidatePayoutMethod|null>(null);
  const [methodError,setMethodError]=useState<string|null>(null);
  const store = useApp();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "tds">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedSlipTx, setSelectedSlipTx] = useState<UiPayoutTransaction | null>(null);

  const candidateLevel =
    store.candidateLevel ||
    (store.profile["level"] as any) ||
    (store.profile["cadreLevel"] as any) ||
    (store.profile["exp"] === "Fresher" ? "fresher" : "professional");
  const isStudent = candidateLevel === "student";

  const [apiPayouts, setApiPayouts] = useState<UiPayoutTransaction[] | null>(null);
  const [loading, setLoading] = useState(isApiEnabled);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if(isStudent) {setLoading(false);return;}
    let alive=true;setLoading(true);setMethodError(null);
    Promise.allSettled([getMyClaims(),getCandidateProfile(),getPayoutMethod()]).then(([claims,profile,method])=>{
      if(!alive)return;
      if(claims.status === "fulfilled" && Array.isArray(claims.value)) {
        setApiPayouts(claims.value.filter(c=>toEarning(c).state!=="application").map(toUiPayout));setLoadError(null);
      } else {setApiPayouts([]);setLoadError("Unable to load earnings and payouts.");pageLoad.fail(claims.status === "rejected" ? claims.reason : new Error("Invalid earnings response"));}
      if(profile.status === "fulfilled" && profile.value) {const p=profile.value;setState(prev=>({profile:{...prev.profile,name:p.name||prev.profile["name"]||"",regNumber:p.regNumber||""}}));}
      if(method.status === "fulfilled") {
        const p=method.value;
        const value:CandidatePayoutMethod|null=p ? {type:p.methodType==="bank" ? "bank":"upi",status:p.status==="Verified"&&p.verifiedAt ? "Verified":"Pending",accountHolderName:p.accountHolderName||"",
          ...(p.upiId?{upiId:p.upiId}:{}),...(p.accountNumberLast4?{accountNumberLast4:p.accountNumberLast4}:{}),...(p.bankName?{bankName:p.bankName}:{}),...(p.ifsc?{ifsc:p.ifsc}:{}),...(p.verifiedAt?{verifiedAt:p.verifiedAt}:{})}:null;
        setLoadedMethod(value);
        if(value) {setPayoutType(value.type);setFormUpiId(value.upiId||"");setFormHolderName(value.accountHolderName||"");setFormBankName(value.bankName||"");setFormIfsc(value.ifsc||"");}
      } else setMethodError("Payout destination could not be loaded. Earnings remain available.");
      setLoading(false);
    });return()=>{alive=false;};
  },[pageLoad.retryKey,isStudent]);

  const candidateName = String(store.profile["name"] || "Clinician");
  const candidatePayoutMethod = loadedMethod;
  const hasLinkedPayout = Boolean(candidatePayoutMethod && (candidatePayoutMethod.upiId || candidatePayoutMethod.accountNumberLast4));


  const payouts: UiPayoutTransaction[] = (apiPayouts || []);

  // Payout Form Modal State
  const [payoutType, setPayoutType] = useState<"upi" | "bank">(candidatePayoutMethod?.type || "upi");
  const [formUpiId, setFormUpiId] = useState(candidatePayoutMethod?.upiId || "");
  const [formHolderName, setFormHolderName] = useState(candidatePayoutMethod?.accountHolderName || candidateName);
  const [formBankName, setFormBankName] = useState(candidatePayoutMethod?.bankName || "");
  const [formAccNumber, setFormAccNumber] = useState("");
  const [formConfirmAcc, setFormConfirmAcc] = useState("");
  const [formIfsc, setFormIfsc] = useState(candidatePayoutMethod?.ifsc || "");
  const [isVerifying, setIsVerifying] = useState(false);

  // Financial Telemetry
  const totalDisbursed = useMemo(() => {
    return payouts
      .filter((p) => p.status === "Disbursed" && p.amountsRecorded)
      .reduce((sum, p) => sum + (p.amountsRecorded ? p.amount : 0), 0);
  }, [payouts]);

  const inEscrowPayouts = useMemo(() => {
    return payouts.filter((p) => p.status === "In Escrow" || p.status === "Pending Payout");
  }, [payouts]);

  const inEscrowAmount = useMemo(() => {
    return inEscrowPayouts.reduce((sum, p) => sum + p.amount, 0);
  }, [inEscrowPayouts]);

  const tdsList = useMemo(()=>payouts.filter(p=>p.status==="Disbursed"&&p.amountsRecorded).map(p=>({id:p.slipRef||p.id,period:p.shiftDate,gross:p.grossAmount!,tdsRate:"Recorded withholding",tdsAmount:p.tdsAmount!,netCredited:p.amount,status:"Recorded - filing not confirmed"})),[payouts]);

  const filteredPayouts = useMemo(() => {
    let list = payouts;
    if (activeTab === "pending") {
      list = list.filter((p) => p.status === "In Escrow" || p.status === "Pending Payout");
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

  const handleCopy = async (text: string, key: string, label: string) => {
    if (!await copyText(text)) return;
    setCopiedKey(key);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSavePayoutMethod=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!formHolderName.trim()) {toast.error("Enter the account holder name.");return;}
    if(payoutType==="upi"&&!/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(formUpiId.trim())) {toast.error("Enter a valid UPI ID.");return;}
    if(payoutType==="bank"&&(!/^\d{9,18}$/.test(formAccNumber)||formAccNumber!==formConfirmAcc||!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formIfsc.toUpperCase())||!formBankName.trim())) {toast.error("Check the bank name, account numbers and IFSC.");return;}
    await action.run(async()=>{setIsVerifying(true);try {
      const saved=await apiSavePayoutMethod({methodType:payoutType,accountHolderName:formHolderName.trim(),...(payoutType==="upi"?{upiId:formUpiId.trim().toLowerCase()}:{accountNumber:formAccNumber,bankName:formBankName.trim(),ifsc:formIfsc.toUpperCase()})});
      setLoadedMethod({type:payoutType,status:saved.status==="Verified"&&saved.verifiedAt ? "Verified":"Pending",accountHolderName:saved.accountHolderName||formHolderName,
        ...(saved.upiId?{upiId:saved.upiId}:{}),...(saved.accountNumberLast4?{accountNumberLast4:saved.accountNumberLast4}:{}),...(saved.bankName?{bankName:saved.bankName}:{}),...(saved.ifsc?{ifsc:saved.ifsc}:{}),...(saved.verifiedAt?{verifiedAt:saved.verifiedAt}:{})});
      setFormAccNumber("");setFormConfirmAcc("");setPayoutModalOpen(false);toast.success("Payout details saved",{description:"Ownership review is required before payment."});
    }finally{setIsVerifying(false);}});
  };
  const openSlip=async(tx:UiPayoutTransaction)=>action.run(async()=>{
    if(!tx.adviceAvailable||!tx.amountsRecorded)throw new Error("Saved payout advice is not available for this duty.");
    setSelectedSlipTx(toUiPayout(await getPayoutAdvice(tx.id)));
  });
  const exportSlip=async(print=false)=>action.run(async()=>{
    if(!selectedSlipTx)return;const fresh=toUiPayout(await getPayoutAdvice(selectedSlipTx.id));
    if(!fresh.adviceAvailable||!fresh.amountsRecorded)throw new Error("Saved payout advice is unavailable.");
    const name=fresh.rawClaim.candidateName||"Name not recorded",reg=fresh.rawClaim.payoutRegistrationNumber||"Not recorded";
    if(print)printPayoutAdvicePdf(fresh,name,reg);else generatePayoutAdvicePdf(fresh,name,reg);
  });

  return (
    <AppShell>
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} /><RequestError message={methodError} onRetry={pageLoad.retry} /><RequestError message={action.error} />
      <div className="w-full space-y-6 pb-16 min-w-0">

        {/* ================= PAGE HEADER (MATCHING HUDDLE) ================= */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px] text-foreground">
              {isStudent ? "Earnings & Clinical Stipends" : "Earnings & Payouts"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {isStudent
                ? "Professional clinical earnings, locum shift payouts, and disbursement accounts."
                : `Track saved shift remuneration, recorded bank payments and deductions for ${candidateName}.`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
            {isStudent ? (
              <Button
                asChild
                variant="outline"
                className="h-10 border-border/80 text-foreground hover:bg-muted text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 rounded-2xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto min-w-0"
              >
                <Link to="/jobs" search={{ q: undefined }}>
                  <HiOutlineSparkles className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">Internships</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="h-10 border-border/80 text-foreground hover:bg-muted text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 rounded-2xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto min-w-0"
                >
                  <Link to="/shifts">
                    <HiOutlineBolt className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">Find Shifts</span>
                  </Link>
                </Button>
                <Button
                  onClick={() => setPayoutModalOpen(true)}
                  className="h-10 bg-primary hover:bg-primary-hover text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 rounded-2xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto min-w-0"
                >
                  {hasLinkedPayout ? (
                    <>
                      <HiOutlinePencilSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate">Update Account</span>
                    </>
                  ) : (
                    <>
                      <HiOutlinePlus className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        <span className="sm:hidden">Add Payout</span>
                        <span className="hidden sm:inline">Add Payout Method</span>
                      </span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {isStudent ? (
          <StudentLockCard
            title="Clinical Earnings Unlock After Graduation"
            description="Shift earnings, automated bank disbursements, and tax certificates will unlock once you complete your graduation and verify your Council Registration."
            item3Title="Recorded Payouts"
            item3Desc="Access recorded bank payments and payout advice."
          />
        ) : (
          <>
            {/* 4 Telemetry Balance Cards (Matching Shifts Page) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {/* Card 1: Total Disbursed */}
              <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                    <HiOutlineBanknotes className="h-5 w-5" />
                  </span>
                  <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider shrink-0 border border-primary/20">
                    Payout history
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {isStudent ? "Disbursed Stipends" : "Disbursed Earnings"}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                    {loading ? "Loading..." : loadError ? "Unavailable" : `\u20b9${(totalDisbursed).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isStudent ? "Credited to bank / UPI" : "Received in bank / UPI"}
                  </p>
                </div>
              </div>

              {/* Card 2: In Escrow */}
              <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                    <HiOutlineLockClosed className="h-5 w-5" />
                  </span>
                  <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider shrink-0 border border-primary/20">
                    {isStudent ? "Next Cycle Ready" : "Awaiting bank payment"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {isStudent ? "Next Stipend Cycle" : "Confirmed duty reserve"}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                    {loading ? "Loading..." : loadError ? "Unavailable" : `\u20b9${(inEscrowAmount).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isStudent
                      ? "Academic rotation"
                      : inEscrowAmount > 0
                      ? `${inEscrowPayouts.length} shift(s) pending clearance`
                      : "Zero shifts in escrow"}
                  </p>
                </div>
              </div>

              {/* Card 3: Monthly Rate */}
              <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                    <HiOutlineArrowTrendingUp className="h-5 w-5" />
                  </span>
                  <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider shrink-0 border border-primary/20">
                    {new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {isStudent ? "Monthly Stipend Rate" : "This Month's Earnings"}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                    {loading ? "Loading..." : loadError ? "Unavailable" : `\u20b9${(totalDisbursed + inEscrowAmount).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isStudent ? "Accredited teaching hospital" : "Net recorded earnings"}
                  </p>
                </div>
              </div>

              {/* Card 4: Rotations / Duties */}
              <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                    <HiOutlineClock className="h-5 w-5" />
                  </span>
                  <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider shrink-0 border border-primary/20">
                    {isStudent ? "Faculty Verified" : "Verified Cover"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    {isStudent ? "Completed Rotations" : "Completed Duties"}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                    {payouts.length} {isStudent ? "Rotations" : payouts.length === 1 ? "Shift" : "Shifts"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isStudent
                      ? "Academic logbook signed"
                      : payouts.some((p) => (p as any).rawClaim?.status === "DISPUTED")
                      ? "1 dispute in mediation"
                      : "Zero payment disputes"}
                  </p>
                </div>
              </div>
            </section>

            {/* Unified Payout Destination Strip */}
            {!hasLinkedPayout ? (
              <section className="rounded-2xl sm:rounded-3xl border border-primary/20 bg-primary-soft/30 p-4 sm:p-5 lg:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                    <span className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl sm:rounded-2xl bg-primary-soft text-primary shrink-0 mt-0.5">
                      <HiOutlineBuildingLibrary className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                          Candidate Payout Destination
                        </h3>
                        <span className="text-[10px] text-primary bg-primary-soft border border-primary/25 px-2.5 py-0.5 rounded-full font-bold">
                          Not Linked
                        </span>
                      </div>

                      {/* Dynamic Amount Highlight */}
                      {totalDisbursed > 0 ? (
                        <p className="text-sm font-black text-primary flex items-center gap-1.5 pt-0.5">
                          <HiOutlineBolt className="h-4 w-4 shrink-0" />
                          <span>{loading ? "Loading..." : loadError ? "Unavailable" : `\u20b9${(totalDisbursed).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`} Recorded bank payments</span>
                        </p>
                      ) : inEscrowAmount > 0 ? (
                        <p className="text-sm font-black text-primary flex items-center gap-1.5 pt-0.5">
                          <HiOutlineBolt className="h-4 w-4 shrink-0" />
                          <span>{loading ? "Loading..." : loadError ? "Unavailable" : `\u20b9${(inEscrowAmount).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`} Reserved for confirmed duties</span>
                        </p>
                      ) : null}

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {totalDisbursed > 0
                          ? "Link your UPI ID or bank account for manual ownership review before bank payment."
                          : inEscrowAmount > 0
                          ? "Link your UPI ID or bank account for manual ownership review before bank payment."
                          : "Link your UPI ID or bank account for manual ownership review before bank payment."}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPayoutModalOpen(true)}
                    className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary-hover text-white shrink-0 shadow-xs cursor-pointer gap-1.5 w-full sm:w-auto justify-center"
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                    <span>Add Payout Method</span>
                  </Button>
                </div>
              </section>
            ) : candidatePayoutMethod ? (
              <section className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-5 lg:p-6 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                    <span className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl sm:rounded-2xl bg-primary-soft text-primary shrink-0 mt-0.5">
                      <HiOutlineCheckBadge className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight leading-snug">
                          Saved Payout Destination
                        </h3>
                        <span className="text-[10px] text-primary bg-primary-soft border border-primary/20 px-2.5 py-0.5 rounded-full font-bold shrink-0">
                          {candidatePayoutMethod.status === "Verified" ? "Ownership verified" : "Ownership review pending"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {candidatePayoutMethod.type === "upi" ? "UPI payout destination" : "Direct Commercial Bank Mandate"}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                        Payment is recorded after an external bank transfer. Saving details starts ownership review.
                      </p>
                    </div>
                  </div>

                  {/* Destination Detail Box */}
                  <div className="bg-muted/40 p-3.5 sm:p-4 rounded-2xl border border-border/70 w-full lg:w-auto min-w-0 sm:min-w-[340px] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">
                          {candidatePayoutMethod.type === "upi" ? "Saved UPI ID" : `${candidatePayoutMethod.bankName || "Commercial Bank"}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(candidatePayoutMethod.type === "upi" ? candidatePayoutMethod.upiId! : (candidatePayoutMethod.accountNumberLast4 || "Not recorded"), "payout", "Payout destination")}
                          className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0 transition-colors p-0.5"
                          title="Copy details"
                        >
                          {copiedKey === "payout" ? <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-600" /> : <HiOutlineDocumentDuplicate className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPayoutModalOpen(true)}
                        className="rounded-xl text-xs font-bold h-8 px-3 shrink-0 cursor-pointer border-primary/40 text-primary hover:bg-primary hover:text-white transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                        <span>Change</span>
                      </Button>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-mono font-bold text-foreground text-sm sm:text-base break-all">
                        {candidatePayoutMethod.type === "upi"
                          ? (candidatePayoutMethod.upiId || "Not Configured")
                          : (candidatePayoutMethod.accountNumberLast4 ? `•••• •••• ${candidatePayoutMethod.accountNumberLast4} (${candidatePayoutMethod.ifsc || ""})` : "Not Configured")}
                      </div>
                      <span className="text-xs text-muted-foreground block">
                        Matched Name: <span className="font-medium text-foreground">{candidatePayoutMethod.accountHolderName || candidateName}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Ledger & Statements (Matching Huddle) */}
            <section className="rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
              {/* Header Controls */}
              <div className="p-4 sm:p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Tab Pills with Smooth Horizontal Mobile Scroll */}
                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar -mx-1 px-1">
                  <div className="inline-flex items-center rounded-2xl bg-muted/60 p-1 border border-border/50 min-w-full sm:min-w-0">
                    {[
                      {
                        id: "all",
                        label: isStudent ? "All Stipend Disbursements" : "All Shift Payouts",
                        mobileLabel: isStudent ? "Stipends" : "All Payouts",
                        count: payouts.length,
                      },
                      {
                        id: "pending",
                        label: isStudent ? "In Escrow (Next Cycle)" : "In Escrow",
                        mobileLabel: isStudent ? "Next Cycle" : "In Escrow",
                        count: inEscrowPayouts.length,
                        activeBadge: inEscrowPayouts.length > 0 ? `${inEscrowPayouts.length} Active` : undefined,
                      },
                      {
                        id: "tds",
                        label: isStudent ? "Tax Exemption & Slips" : "TDS & Tax Slips",
                        mobileLabel: isStudent ? "Tax Exemption" : "Tax Slips",
                        count: tdsList.length,
                      },
                    ].map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                          "whitespace-nowrap shrink-0 flex-1 sm:flex-initial rounded-xl px-2.5 sm:px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
                          activeTab === tab.id
                            ? "bg-card text-primary shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.mobileLabel}</span>
                        {tab.activeBadge ? (
                          <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded-full font-bold">
                            {tab.activeBadge}
                          </span>
                        ) : tab.count !== undefined ? (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                            activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {tab.count}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Box matching Huddle */}
                {activeTab !== "tds" && (
                  <div className="flex items-center gap-2 rounded-2xl bg-muted/40 border border-border/70 px-3.5 py-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all w-full sm:w-72">
                    <HiOutlineMagnifyingGlass className="h-4 w-4 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder={isStudent ? "Filter rotation, hospital..." : "Filter shift, hospital..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-medium"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="rounded-full p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Clear search"
                      >
                        <HiOutlineXMark className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* TAB 1: Payouts Ledger Table / Mobile Cards */}
              {activeTab !== "tds" && (
                <>
                  {/* Mobile View: High-density interactive cards */}
                  <div className="sm:hidden divide-y divide-border/60">
                    {loading ? (
                      <div className="py-12 px-4 text-center text-muted-foreground text-xs font-medium">
                        <ButtonSpinner className="mx-auto h-6 w-6 text-primary" />
                        <p className="mt-2 font-semibold">Loading shift claims & payouts...</p>
                      </div>
                    ) : loadError ? (
                      <div className="py-12 px-4 text-center text-rose-500 text-xs font-medium">
                        {loadError}
                      </div>
                    ) : filteredPayouts.length === 0 ? (
                      <div className="py-12 px-4 text-center space-y-3">
                        <EmptyEarningsGraphic className="w-36 h-36 mx-auto" />
                        <h4 className="font-extrabold text-sm text-foreground tracking-tight">
                          {searchQuery
                            ? "No matching shift payouts found"
                            : activeTab === "pending"
                            ? "No payouts currently in escrow"
                            : isStudent
                            ? "No clinical stipends recorded yet"
                            : "No clinical shift payouts recorded yet"}
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          {searchQuery
                            ? "Try adjusting your search terms or clearing the filter."
                            : activeTab === "pending"
                            ? "Approved duties await recorded bank payment."
                            : isStudent
                            ? "Your verified clinical rotations and academic allowances will appear here."
                            : "Complete verified clinical duties to see recorded earnings."}
                        </p>
                        {searchQuery ? (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-primary text-primary px-4 py-1.5 text-xs font-bold hover:bg-primary hover:text-white transition-all cursor-pointer mt-2"
                          >
                            Clear search filter
                          </button>
                        ) : activeTab === "pending" ? (
                          <button
                            type="button"
                            onClick={() => setActiveTab("all")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-primary text-primary px-4 py-1.5 text-xs font-bold hover:bg-primary hover:text-white transition-all cursor-pointer mt-2"
                          >
                            View all payouts
                          </button>
                        ) : (
                          <Link
                            to="/shifts"
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer mt-2"
                          >
                            Browse Available Shifts
                          </Link>
                        )}
                      </div>
                    ) : (
                      filteredPayouts.map((tx) => (
                        <div key={tx.id} className="p-4 space-y-2.5 hover:bg-muted/10 transition-colors">
                          {/* Top Row: Shift Role & Amount + Status Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-foreground leading-snug">{tx.shiftTitle}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {tx.hospitalName} · {tx.dept}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-black tracking-tight text-base sm:text-lg text-foreground">
                                {tx.amountsRecorded ? `\u20b9${tx.amount.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "Amount not recorded"}
                              </div>
                                <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1",
                                  tx.status === "Disbursed"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                    : tx.status === "Disputed (Frozen)"
                                      ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                                      : tx.status === "Refunded to Hospital" || tx.status === "Cancelled"
                                        ? "bg-muted text-muted-foreground border border-border/60"
                                        : "bg-primary-soft text-primary border border-primary/25"
                                )}
                              >
                                {tx.status}
                              </span>
                            </div>
                          </div>

                          {/* Middle Row: Schedule Badges (Fits cleanly without wrapping) */}
                          <div className="flex items-center gap-1.5 pt-0.5 text-xs">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground bg-muted/60 border border-border/60 px-2 py-0.5 rounded-lg shrink-0">
                              <HiOutlineCalendarDays className="h-3 w-3 text-muted-foreground" />
                              <span>{tx.shiftDate}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-lg shrink-0">
                              <HiOutlineClock className="h-3 w-3" />
                              <span>{tx.hours} hrs {isStudent ? "rotation" : `@ ₹${tx.rate}/hr`}</span>
                            </span>
                          </div>

                          {/* Bottom Row: Clean Payout Destination & Advice Slip Action */}
                          <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-border/40 text-xs">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                {tx.payoutMethodUsed.toLowerCase().includes("upi") ? (
                                  <HiOutlineBolt className="h-3.5 w-3.5 text-primary shrink-0" />
                                ) : (
                                  <HiOutlineBuildingLibrary className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                                <span className="truncate text-[11px] font-mono text-foreground font-semibold">
                                  {formatMobilePayoutMethod(tx.payoutMethodUsed)}
                                </span>
                              </div>
                              {tx.utr && (
                                <div className="text-[10px] text-muted-foreground/80 font-mono mt-0.5 truncate pl-5">
                                  UTR: {tx.utr}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={!tx.adviceAvailable || !tx.amountsRecorded || action.isPending}
                                  onClick={() => void openSlip(tx)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-primary bg-primary-soft hover:bg-primary hover:text-white font-bold text-xs transition-all cursor-pointer shrink-0 border border-primary/20 shadow-2xs"
                              title="View & Print Payout Advice Slip"
                            >
                              <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                              <span>Advice Slip</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop View: Full-featured Table */}
                  <div className="hidden sm:block overflow-x-auto scrollbar-none">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                          <th className="py-3.5 px-5">{isStudent ? "Rotation Period" : "Shift Date"}</th>
                          <th className="py-3.5 px-5">{isStudent ? "Program & Teaching Hospital" : "Role & Facility"}</th>
                          <th className="py-3.5 px-5">{isStudent ? "Academic Hours" : "Duration & Rate"}</th>
                          <th className="py-3.5 px-5">Status</th>
                          <th className="py-3.5 px-5">Disbursed Via</th>
                          <th className="py-3.5 px-5 text-right">{isStudent ? "Net Stipend" : "Net Remuneration"}</th>
                          <th className="py-3.5 px-5 text-right">Advice Slip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-muted-foreground font-medium">
                              <ButtonSpinner className="mx-auto h-6 w-6 text-primary" />
                              <p className="mt-2 text-xs font-semibold">Loading shift claims & payouts...</p>
                            </td>
                          </tr>
                        ) : loadError ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-rose-500 font-medium text-xs">
                              {loadError}
                            </td>
                          </tr>
                        ) : filteredPayouts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-14 px-6 text-center">
                              <div className="max-w-md mx-auto space-y-3">
                                <EmptyEarningsGraphic className="w-40 h-40 mx-auto" />
                                <h4 className="text-base font-extrabold text-foreground tracking-tight">
                                  {searchQuery
                                    ? "No matching shift payouts found"
                                    : activeTab === "pending"
                                    ? "No payouts currently in escrow"
                                    : isStudent
                                    ? "No clinical stipends recorded yet"
                                    : "No clinical shift payouts recorded yet"}
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {searchQuery
                                    ? "Try adjusting your search terms or clearing the filter."
                                    : activeTab === "pending"
                                    ? "Approved duties await recorded bank payment."
                                    : isStudent
                                    ? "Your verified clinical rotations and academic allowances will appear here."
                                    : "Complete verified clinical duties to see recorded earnings."}
                                </p>
                                {searchQuery ? (
                                  <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-primary text-primary px-4 py-1.5 text-xs font-bold hover:bg-primary hover:text-white transition-all cursor-pointer mt-2"
                                  >
                                    Clear search filter
                                  </button>
                                ) : activeTab === "pending" ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab("all")}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-primary text-primary px-4 py-1.5 text-xs font-bold hover:bg-primary hover:text-white transition-all cursor-pointer mt-2"
                                  >
                                    View all payouts
                                  </button>
                                ) : (
                                  <Link
                                    to="/shifts"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer mt-2"
                                  >
                                    Browse Available Shifts
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredPayouts.map((tx) => (
                            <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                              <td className="py-4 px-5 whitespace-nowrap text-muted-foreground font-medium">
                                {tx.shiftDate}
                              </td>
                              <td className="py-4 px-5">
                                <div className="font-bold text-sm text-foreground">{tx.shiftTitle}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{tx.hospitalName} · {tx.dept}</div>
                              </td>
                              <td className="py-4 px-5 whitespace-nowrap text-muted-foreground font-medium">
                                <div>{tx.hours} hrs {isStudent ? "rotation" : `@ ₹${tx.rate}/hr`}</div>
                              </td>
                              <td className="py-4 px-5 whitespace-nowrap">
                                <span
                                  className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    tx.status === "Disbursed"
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                      : tx.status === "Disputed (Frozen)"
                                        ? "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
                                        : tx.status === "Refunded to Hospital" || tx.status === "Cancelled"
                                          ? "bg-muted text-muted-foreground border border-border/60"
                                          : "bg-primary-soft text-primary border border-primary/25"
                                  )}
                                >
                                  {tx.status}
                                </span>
                              </td>
                              <td className="py-4 px-5 whitespace-nowrap text-xs text-muted-foreground font-mono">
                                <div>{tx.payoutMethodUsed}</div>
                                {tx.utr && <div className="text-[10px] text-muted-foreground/70 mt-0.5">UTR: {tx.utr}</div>}
                              </td>
                              <td className="py-4 px-5 whitespace-nowrap text-right font-black tracking-tight text-sm sm:text-base text-foreground">
                                {tx.amountsRecorded ? `\u20b9${tx.amount.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "Amount not recorded"}
                              </td>
                              <td className="py-4 px-5 whitespace-nowrap text-right">
                                <button
                                  type="button"
                                  disabled={!tx.adviceAvailable || !tx.amountsRecorded || action.isPending}
                                  onClick={() => void openSlip(tx)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-primary bg-primary-soft hover:bg-primary hover:text-white font-bold text-xs transition-all cursor-pointer border border-primary/20"
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
                </>
              )}

              {/* TAB 2: TDS & Form 16A Summaries */}
              {activeTab === "tds" && (
                <div>
                  <div className="px-5 py-3.5 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-3">
                    <span className="leading-relaxed">
                      Recorded withholding from saved disbursed claims. This summary does not confirm tax filing or deposit; official certificates are not connected.
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled title="Tax certificate service is not connected"
                      className="h-8 text-xs text-primary font-bold hover:bg-muted cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      {isStudent ? "Email Exemption Slip" : "Email Form 16A Summary"}
                    </Button>
                  </div>

                  {/* Mobile Card List for TDS */}
                  <div className="sm:hidden divide-y divide-border/60">
                    {tdsList.length === 0 ? (
                      <div className="py-12 px-4 text-center space-y-3">
                        <EmptyEarningsGraphic className="w-32 h-32 mx-auto" />
                        <h4 className="text-sm font-extrabold text-foreground tracking-tight">
                          No tax deduction statements generated yet
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          {isStudent
                            ? "Academic stipends are tax-exempt under Section 10(16)."
                            : "Official tax certificates are not connected. Saved withholding appears after recorded bank disbursement."}
                        </p>
                      </div>
                    ) : (
                      tdsList.map((t) => (
                      <div key={t.id} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-xs text-foreground block">{t.id}</span>
                            <span className="text-xs text-muted-foreground mt-0.5 block">{t.period} · {t.tdsRate}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-black tracking-tight text-sm text-foreground">₹{(t.netCredited).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">Gross: ₹{(t.gross).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                          <span className="text-[11px] text-muted-foreground">
                            TDS: <span className={t.tdsAmount === 0 ? "text-muted-foreground font-medium" : "text-destructive font-semibold"}>
                              {t.tdsAmount === 0 ? "₹0" : `-₹${(t.tdsAmount).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`}
                            </span>
                          </span>
                          <button
                            type="button"
                            disabled title="Tax certificate service is not connected"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-primary bg-primary-soft hover:bg-primary hover:text-white font-bold text-xs transition-all cursor-pointer border border-primary/20"
                          >
                            <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    )))}
                  </div>

                  {/* Desktop Table for TDS */}
                  <div className="hidden sm:block overflow-x-auto scrollbar-none">
                    <table className="w-full text-left text-xs min-w-[660px]">
                      <thead>
                        <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-bold text-[11px] uppercase tracking-wider">
                          <th className="py-3.5 px-5">Statement #</th>
                          <th className="py-3.5 px-5">Period</th>
                          <th className="py-3.5 px-5 text-right">{isStudent ? "Gross Stipend" : "Gross Earnings"}</th>
                          <th className="py-3.5 px-5 text-right">Tax Section</th>
                          <th className="py-3.5 px-5 text-right">TDS Deducted</th>
                          <th className="py-3.5 px-5 text-right">Net Received</th>
                          <th className="py-3.5 px-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {tdsList.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 px-6 text-center">
                              <div className="max-w-md mx-auto space-y-3">
                                <EmptyEarningsGraphic className="w-36 h-36 mx-auto" />
                                <h4 className="text-sm font-extrabold text-foreground tracking-tight">
                                  No tax deduction statements generated yet
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {isStudent
                                    ? "Academic stipends are tax-exempt under Section 10(16)."
                                    : "Quarterly TDS certificates (Form 16A) are generated after verified quarterly filing."}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          tdsList.map((t) => (
                          <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-4 px-5 whitespace-nowrap font-mono font-bold text-foreground">
                              {t.id}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap text-muted-foreground font-medium">
                              {t.period}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap text-right font-mono text-muted-foreground font-medium">
                              ₹{t.gross.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap text-right font-medium text-foreground">
                              {t.tdsRate}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap text-right font-mono text-destructive font-semibold">
                              {t.tdsAmount === 0 ? "₹0" : `-₹${t.tdsAmount.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap text-right font-mono font-bold text-foreground">
                              ₹{t.netCredited.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}
                            </td>
                            <td className="py-4 px-5 whitespace-nowrap text-right">
                              <button
                                type="button"
                                disabled title="Tax certificate service is not connected"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-primary bg-primary/10 hover:bg-primary hover:text-white font-bold text-xs transition-all cursor-pointer"
                              >
                                <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                                <span>Download</span>
                              </button>
                            </td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

      </div>

      {/* MODAL: Update Payout Method (UPI or Bank Account) */}
      <Dialog open={payoutModalOpen} onOpenChange={setPayoutModalOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-border/80 shadow-2xl bg-card">
          {/* Fixed Header */}
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60 shrink-0 text-left space-y-1 bg-card">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
                <HiOutlineBanknotes className="h-5 w-5" />
              </span>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                Payout Destination
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-0.5 leading-relaxed">
              Configure your UPI ID or bank account for ownership review.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSavePayoutMethod} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 flex-1">
              {/* Type Switcher with Stacked Mobile-Friendly Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Choose Payout Method</label>
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPayoutType("upi")}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3",
                      payoutType === "upi"
                        ? "border-primary bg-primary-soft/20 ring-1 ring-primary/40 shadow-xs"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        payoutType === "upi" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <HiOutlineBolt className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">UPI destination</span>
                          <span className="text-[10px] bg-primary-soft text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                            UPI destination
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-1 leading-snug">
                          GPay, PhonePe, Paytm, BHIM, Cred
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all",
                      payoutType === "upi" ? "border-primary bg-primary text-white" : "border-muted-foreground/40"
                    )}>
                      {payoutType === "upi" && <span className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutType("bank")}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3",
                      payoutType === "bank"
                        ? "border-primary bg-primary-soft/20 ring-1 ring-primary/40 shadow-xs"
                        : "border-border bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
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
                        <span className="text-[11px] text-muted-foreground block mt-1 leading-snug">
                          Direct transfer to any verified savings or current account
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all",
                      payoutType === "bank" ? "border-primary bg-primary text-white" : "border-muted-foreground/40"
                    )}>
                      {payoutType === "bank" && <span className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-foreground">
                  Account Holder Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formHolderName}
                  onChange={(e) => setFormHolderName(e.target.value)}
                  placeholder="e.g. Dr. Sneha Sharma"
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-[11px] text-muted-foreground">
                  Must match the name on your State Medical / Nursing Council registration.
                </p>
              </div>

              {/* UPI Fields */}
              {payoutType === "upi" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-foreground">
                    Virtual Payment Address (UPI ID) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUpiId}
                    onChange={(e) => setFormUpiId(e.target.value)}
                    placeholder="e.g. clinician@okhdfcbank or 9845012345@paytm"
                    className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    An admin reviews account ownership evidence before enabling payment.
                  </p>
                </div>
              )}

              {/* Bank Account Fields */}
              {payoutType === "bank" && (
                <div className="space-y-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Bank Name <span className="text-destructive">*</span>
                    </label>
                    <Select value={formBankName} onValueChange={setFormBankName}>
                      <SelectTrigger className="h-10 rounded-xl border-input bg-card px-3 text-xs font-medium">
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
                      <label className="text-xs font-bold text-foreground">
                        Account Number <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formAccNumber}
                        onChange={(e) => setFormAccNumber(e.target.value)}
                        placeholder="50100412891234"
                        className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        Confirm Number <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formConfirmAcc}
                        onChange={(e) => setFormConfirmAcc(e.target.value)}
                        placeholder="Re-enter number"
                        className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      IFSC Code <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formIfsc}
                      onChange={(e) => setFormIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0000060"
                      className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Cashfree Guarantee Note */}
              <div className="p-3.5 rounded-2xl border border-primary/20 bg-primary-soft/30 text-xs text-muted-foreground space-y-1 mt-2">
                <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                  <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Payout ownership review</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Saving details starts a manual ownership review. Payment is recorded after an external bank transfer and has no guaranteed transfer time.
                </p>
              </div>
            </div>

            {/* Sticky Actions Footer */}
            <div className="p-4 border-t border-border/60 bg-card shrink-0 flex items-center justify-end gap-2.5 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPayoutModalOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-4 cursor-pointer border-border hover:bg-muted text-foreground flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={isVerifying}
                loadingText="Saving payout details..."
                className="rounded-xl text-xs font-bold h-10 px-5 cursor-pointer bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 flex-1 sm:flex-initial"
              >
                <HiOutlineCheck className="h-4 w-4" />
                <span>Save for review</span>
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
                      <p className="font-bold text-foreground/90">THE FALE</p>
                      <p>Healthcare Staffing &amp; Payout Records</p>
                      <p>Recorded payment advice - not a tax certificate</p>
                      <p>Issuer particulars available from billing · support@thefale.com</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1 min-w-0">
                    <span className="inline-block text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      PAYOUT ADVICE SLIP
                    </span>
                    <div className="font-mono text-xs font-bold text-foreground mt-1 break-all">
                      {selectedSlipTx.slipRef}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Disbursal Date: <span className="font-medium text-foreground">{selectedSlipTx.payoutDate}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Settlement Route: <span className="font-medium text-foreground">Recorded bank payment</span>
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
                          : "AWAITING BANK PAYMENT"}
                      </span>
                      <span className="text-[11px] opacity-85 block mt-0.5">
                        {selectedSlipTx.status === "Disbursed"
                          ? "Timesheet verified by hospital supervisor • Remuneration transferred to candidate."
                          : "Hospital-approved amounts await recorded bank payment."}
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
                      Awaiting bank payment
                    </div>
                  )}
                </div>

                {/* 3. Beneficiary & Hospital Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-border/70 rounded-xl p-4 bg-muted/20">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Beneficiary Healthcare Professional
                    </p>
                    <div className="font-bold text-sm text-foreground">{selectedSlipTx.rawClaim.candidateName || "Name not recorded"}</div>
                    <div className="space-y-0.5 text-[11px] text-muted-foreground">
                      <p><span className="text-foreground font-medium">Council Reg. #:</span> {String(selectedSlipTx.rawClaim.payoutRegistrationNumber || "Not recorded")}</p>
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
                      <p>
                        <span className="text-foreground font-medium">Duty Hours:</span> {selectedSlipTx.hours} Hours (@ ₹{selectedSlipTx.rate.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}/hr)
                      </p>
                      {selectedSlipTx.rawClaim?.actualHours && selectedSlipTx.rawClaim?.hours && selectedSlipTx.rawClaim.actualHours !== selectedSlipTx.rawClaim.hours && (
                        <p className="text-amber-600 dark:text-amber-400 font-semibold text-[10px] pt-0.5">
                          Verified Duty: {selectedSlipTx.rawClaim.actualHours} hrs (Scheduled: {selectedSlipTx.rawClaim.hours} hrs · {selectedSlipTx.rawClaim.hours - selectedSlipTx.rawClaim.actualHours} hrs unused escrow refunded to hospital)
                        </p>
                      )}
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
                            {selectedSlipTx.hours} hrs × ₹{selectedSlipTx.rate.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}/hr
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-foreground shrink-0">
                          ₹{(selectedSlipTx.grossAmount ?? 0).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Allowance breakdown</span>
                        <span className="font-mono">Included in gross</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>FALE Platform Fee (Candidate)</span>
                        <span className={selectedSlipTx.platformFee ? "font-mono text-muted-foreground" : "text-emerald-600 font-semibold"}>
                          {selectedSlipTx.platformFee ? `-₹${selectedSlipTx.platformFee.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "No candidate fee"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Recorded TDS Withholding</span>
                        <span className="font-mono">
                          {selectedSlipTx.tdsAmount ? `-₹${selectedSlipTx.tdsAmount.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "₹0.00"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t-2 border-border/80 text-xs">
                        <span className="font-bold text-foreground">Net Disbursed Remuneration</span>
                        <span className="font-mono font-black text-sm text-primary">
                          ₹{selectedSlipTx.amount.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}
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
                          <th className="py-2.5 px-3 text-right">Average Rate</th>
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
                            ₹{selectedSlipTx.rate.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})} / hr
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                            ₹{(selectedSlipTx.grossAmount ?? 0).toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">
                            Allowance breakdown
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
                          <td className={selectedSlipTx.platformFee ? "py-2 px-3 text-right font-mono text-muted-foreground" : "py-2 px-3 text-right text-emerald-600 font-semibold"}>
                            {selectedSlipTx.platformFee ? `-₹${selectedSlipTx.platformFee.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "100% Free"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                            {selectedSlipTx.platformFee ? `-₹${selectedSlipTx.platformFee.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "₹0.00"}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-muted-foreground">
                            Recorded TDS Withholding
                          </td>
                          <td className="py-2 px-3 text-center text-muted-foreground font-mono">-</td>
                          <td className="py-2 px-3 text-right text-muted-foreground font-mono">
                            {selectedSlipTx.tdsAmount ? "Recorded withholding" : "Recorded withholding"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                            {selectedSlipTx.tdsAmount ? `-₹${selectedSlipTx.tdsAmount.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}` : "₹0.00"}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot className="border-t-2 border-border/80 bg-muted/30">
                        <tr>
                          <td colSpan={3} className="py-3 px-3 font-bold text-sm text-foreground">
                            Net Disbursed Professional Remuneration
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-base text-primary">
                            ₹{selectedSlipTx.amount.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}
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
                    <span className="font-bold text-foreground">Recorded bank payment</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Escrow Nodal A/C</span>
                    <span className="font-mono font-medium text-foreground">Saved claim destination</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Disbursal Mode</span>
                    <span className="font-medium text-foreground">External bank transfer</span>
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
                      This advice reflects saved claim amounts and bank references. It does not confirm tax filing or tax deposit. Pending advice is not proof of payment.</p>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl border border-primary/20 bg-primary/5 shrink-0 text-left">
                    <HiOutlineShieldCheck className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block text-[11px]">FALE PAYOUT RECORD</span>
                      <span className="text-[9px] text-muted-foreground block">System-generated record</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Sticky Action Bar (Hidden when printing) */}
          <div className="p-3.5 px-4 sm:px-6 border-t border-border/60 bg-card flex items-center justify-between gap-3 shrink-0 print:hidden">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Recorded Locum Payout Advice · Saved claim ledger
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
                onClick={() => void exportSlip(true)}
                isLoading={action.isPending}
                className="h-9 rounded-xl text-xs font-semibold gap-1.5 px-3.5 cursor-pointer hidden sm:flex"
              >
                <HiOutlinePrinter className="h-3.5 w-3.5 shrink-0" />
                <span>Print</span>
              </Button>
              <Button
                size="sm"
                onClick={() => void exportSlip()}
                isLoading={action.isPending}
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
