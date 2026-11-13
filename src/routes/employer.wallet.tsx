import { walletDocumentTitle, includeStatement } from "@/lib/walletDocuments";
import { recordedBaseAmount, recordedBillingAmounts } from "@/lib/shiftCharges";
import { copyText } from "@/lib/copyText";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineBanknotes,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineArrowTrendingUp,
  HiOutlinePlus,
  HiOutlineArrowDownLeft,
  HiOutlineArrowUpRight,
  HiOutlineDocumentArrowDown,
  HiOutlineBuildingLibrary,
  HiOutlineDocumentDuplicate,
  HiOutlineMagnifyingGlass,
  HiOutlineCheck,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlineArrowUpTray,
  HiOutlineDocumentText,
  HiOutlinePencilSquare,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineTrash,
  HiOutlinePrinter,
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
import { useApp, setState, type WalletTransaction, type HospitalBankAccount } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees, rupeesToPaise } from "@/lib/api";
import {
  getFacilityWallet,
  getWalletTransactions,
  topUpWallet,
  buyCandidateCredits,
  getHospitalBankAccount,
  updateHospitalBankAccount,
  getFacilityProfile,
  type FacilityWalletDto,
  type WalletTransactionDto,
  type HospitalBankAccountDto,
  type FacilityProfileDto,
} from "@/lib/adapters/facilityAdapter";
import {
  generateHospitalInvoicePdf,
  printHospitalInvoicePdf,
  type HospitalInvoicePdfData,
} from "@/lib/hospitalInvoicePdf";

export const Route = createFileRoute("/employer/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet & Escrow — The Fale Hospital Portal" },
      {
        name: "description",
        content: "Hospital escrow reserve balance, shift disbursements, sourcing credits, linked bank account, and GST billing statements.",
      },
    ],
  }),
  component: EmployerWalletPage,
});

const creditPackages = [
  { id: "pkg-1", name: "Starter", credits: 10, price: "₹1,999", perCredit: "₹199 / unlock" },
  { id: "pkg-2", name: "Growth", credits: 30, price: "₹4,999", perCredit: "₹166 / unlock", popular: true },
  { id: "pkg-3", name: "Enterprise", credits: 100, price: "₹12,999", perCredit: "₹129 / unlock" },
];


function EmployerWalletPage() {
  const pageLoad = usePageLoad();
  const pageAction = useConfirmedAction();
  const store = useApp();
  const [activeTab, setActiveTab] = useState<"all" | "shifts" | "credits" | "invoices" | "bank">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showFullAcc, setShowFullAcc] = useState(false);

  // Modals
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [depositReference, setDepositReference] = useState("");
  const [buyCreditsModalOpen, setBuyCreditsModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<HospitalInvoicePdfData | null>(null);

  // Dynamic API State
  const [apiWallet, setApiWallet] = useState<FacilityWalletDto | null>(null);
  const [apiTransactions, setApiTransactions] = useState<WalletTransactionDto[]>([]);
  const [apiBank, setApiBank] = useState<HospitalBankAccountDto | null>(null);
  const [apiProfile, setApiProfile] = useState<FacilityProfileDto | null>(null);
  const [loading, setLoading] = useState(isApiEnabled);

  const fetchWalletData = () => {
    setLoading(true);
    Promise.all([
      getFacilityWallet(),
      getWalletTransactions(),
      getHospitalBankAccount(),
      getFacilityProfile(),
    ])
      .then(([wallet, txs, bank, prof]) => {
        setApiWallet(wallet);
        setApiTransactions(txs);
        setApiBank(bank);
        if (prof) {
          setApiProfile(prof);
          if (prof.hospitalName && store.profile?.["org"] !== prof.hospitalName) {
            setState((s) => ({
              ...s,
              profile: {
                ...s.profile,
                org: prof.hospitalName,
                hospitalName: prof.hospitalName,
                city: prof.city || String(s.profile["city"] || ""),
              },
            }));
          }
        }
      }).catch(pageLoad.fail)
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWalletData();
    const handleWalletUpdated = () => fetchWalletData();
    window.addEventListener("fale:wallet-updated", handleWalletUpdated);
    return () => {
      window.removeEventListener("fale:wallet-updated", handleWalletUpdated);
    };
  }, [pageLoad.retryKey]);

  // Top Up State
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState<number>(25000);
  const [customTopUpInput, setCustomTopUpInput] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "netbanking" | "neft">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(creditPackages[1]);

  // Bank Form State
  const orgName = apiProfile?.hospitalName || String(store.profile["org"] || store.profile["hospitalName"] || (store as any)?.facilityProfile?.hospitalName || "Healthcare Facility");
  const defaultHolder = orgName;

  const currentBank: HospitalBankAccount | null = apiBank && (apiBank.accountNumberMasked || apiBank.accountNumberLast4) ? {
    bankName: apiBank.bankName || "Current Bank",
    accountNumber: apiBank.accountNumberMasked || (apiBank.accountNumberLast4 ? `•••• •••• ${apiBank.accountNumberLast4}` : ""),
    ifsc: apiBank.ifsc || apiBank.ifscCode || "",
    accountType: (apiBank.accountType as any) || "Current",
    accountHolderName: apiBank.accountHolderName || defaultHolder,
    branch: apiBank.branch || "Not recorded",
    status: (apiBank.status || apiBank.verificationStatus || "Under Review") as HospitalBankAccount["status"],
    documentName: "",
    documentDate: apiBank.verifiedAt ? new Date(apiBank.verifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Active",
    verifiedAt: apiBank.verifiedAt || "",
  } : null;

  const hasLinkedBank = Boolean(currentBank && currentBank.accountNumber && currentBank.accountNumber.length > 3);

  const [formHolderName, setFormHolderName] = useState(defaultHolder);
  const [formBankName, setFormBankName] = useState(currentBank?.bankName || "");
  const [formAccNumber, setFormAccNumber] = useState("");
  const [formConfirmAcc, setFormConfirmAcc] = useState("");
  const [formIfsc, setFormIfsc] = useState(currentBank?.ifsc || "");
  const [formBranch, setFormBranch] = useState(currentBank?.branch || "");
  const [formAccType, setFormAccType] = useState<"Current" | "Escrow Sub-Account">(currentBank?.accountType || "Current");
  const [isSavingBank, setIsSavingBank] = useState(false);

  const escrowBalance = (apiWallet ? paiseToRupees(apiWallet.availableBalancePaise) : 0);
  const lockedEscrow = (apiWallet ? paiseToRupees(apiWallet.lockedEscrowBalancePaise) : 0);
  const candidateCredits = (apiWallet ? apiWallet.candidateCredits : 0);
  const totalDisbursed = (apiWallet ? paiseToRupees(apiWallet.totalDisbursedPaise || 0) : 0);

  const lockedShiftCount = new Set(apiTransactions.filter(t => t.type === "disbursement" && t.status === "Processing" && t.claimId).map(t => t.claimId)).size;

  const virtualAccount = apiWallet?.facilityId
    ? `WALLET-${apiWallet.facilityId}`
    : "Not available";

  const resolveInvoiceBreakdown = (total: number, rawType?: string, invId?: string, feePaise?: number | null, gstPaise?: number | null) => {
    const type = (rawType || "").toLowerCase();
    const docType = type.includes("refund") || invId?.startsWith("CRN-") ? "CREDIT_NOTE" as const
      : type.includes("topup") || type.includes("escrow") ? "ESCROW_RECEIPT" as const : "TAX_INVOICE" as const;
    return { ...recordedBillingAmounts(total, feePaise, gstPaise), docType, statusLabel: "Recorded" };
  };
  const dynamicInvoices = useMemo(() => apiTransactions.filter(tx => includeStatement(tx) && (tx.invoiceId || ["topup", "refund", "disbursement", "escrow_hold", "credit_purchase"].includes(tx.type || "")))
    .map(tx => {
      const total = Math.abs(paiseToRupees(tx.amountPaise));
      const id = tx.invoiceId || tx.refNumber || tx.id;
      const breakdown = resolveInvoiceBreakdown(total, tx.type, id, tx.platformFeePaise, tx.platformFeeGstPaise);
      const date = tx.createdAt ? new Date(tx.createdAt) : null;
      return { id, month: date ? date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Date unavailable",
        date: date ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date unavailable",
        desc: tx.title || "Wallet transaction", ...breakdown, platformFee: tx.platformFeePaise == null ? undefined : breakdown.platformFee, total, status: tx.status || "Recorded", txType: tx.type,
        refNumber: tx.refNumber || tx.id, utr: tx.utr, subtitle: tx.subtitle || "", canonicalDocument: tx.canonicalDocument, destinationSnapshot: tx.destinationSnapshot, bankDisbursedAt: tx.bankDisbursedAt };
    }), [apiTransactions]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return dynamicInvoices;
    const q = searchQuery.toLowerCase();
    return dynamicInvoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(q) ||
        inv.desc.toLowerCase().includes(q) ||
        inv.month.toLowerCase().includes(q) ||
        inv.refNumber.toLowerCase().includes(q)
    );
  }, [dynamicInvoices, searchQuery]);

  const transactions: WalletTransaction[] = useMemo(() => {
    {
      return apiTransactions.map((tx) => {
        const rawType = (tx.type || "").toLowerCase();
        let mappedType: WalletTransaction["type"] = "escrow_hold";
        if (rawType.includes("topup")) mappedType = "topup";
        else if (rawType.includes("credit")) mappedType = "credit_purchase";
        else if (rawType.includes("refund")) mappedType = "refund" as any;
        else if (rawType.includes("disburs")) mappedType = "disbursement";

        const invId = tx.invoiceId || tx.refNumber || tx.id;

        return {
          id: tx.id,
          type: mappedType,
          title: tx.title || "Escrow Operation",
          subtitle: tx.subtitle || "Institutional settlement",
          amount: paiseToRupees(tx.amountPaise),
          date: tx.createdAt
            ? new Date(tx.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            : "Not recorded",
          status: (tx.status || "Unknown") as any,
          refNumber: tx.refNumber || tx.id,
          invoiceId: invId,
          platformFeePaise: tx.platformFeePaise, platformFeeGstPaise: tx.platformFeeGstPaise,
          canonicalDocument: tx.canonicalDocument, destinationSnapshot: tx.destinationSnapshot, bankDisbursedAt: tx.bankDisbursedAt,
          utr: tx.utr,
        };
      });
    }

  }, [isApiEnabled, apiTransactions, store.walletTransactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    if (activeTab === "shifts") {
      list = list.filter((t) => t.type === "escrow_hold" || t.type === "disbursement" || t.type === "standby_credit" || (t.type as any) === "refund");
    } else if (activeTab === "credits") {
      list = list.filter((t) => t.type === "credit_purchase");
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.refNumber.toLowerCase().includes(q) ||
        (t.utr && t.utr.toLowerCase().includes(q))
    );
  }, [transactions, activeTab, searchQuery]);

  const handleCopy = async (text: string, key: string, label: string) => {
    if (!await copyText(text)) return;
    setCopiedKey(key);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const prepareInvoiceData = (invOrTx: any): HospitalInvoicePdfData => {
    const rawAmount = "amountPaise" in invOrTx
      ? paiseToRupees(invOrTx.amountPaise)
      : "amount" in invOrTx
        ? invOrTx.amount
        : invOrTx.total;
    const total = Math.abs(Number(rawAmount) || 0);
    const rawType = invOrTx.transactionType || invOrTx.txType || invOrTx.type || "";
    const defaultPrefix = String(rawType).toLowerCase().includes("refund") ? "CRN" : "INV";
    const invId = invOrTx.invoiceId || invOrTx.refNumber || invOrTx.id;
    const hasPrecomputed = invOrTx.docType && invOrTx.subtotal !== undefined && invOrTx.gst !== undefined;
    const breakdown = hasPrecomputed
      ? {
          docType: invOrTx.docType as NonNullable<HospitalInvoicePdfData["docType"]>,
          subtotal: Number(invOrTx.subtotal),
          gst: Number(invOrTx.gst),
          statusLabel: invOrTx.status || "Recorded",
        }
      : resolveInvoiceBreakdown(total, rawType, invId, invOrTx.platformFeePaise, invOrTx.platformFeeGstPaise);

    return {
      invoiceId: invId,
      date: invOrTx.date || "Not recorded",
      period: invOrTx.month || invOrTx.period || "Not recorded",
      hospitalName: String(store.profile["org"] || ("Healthcare Facility")),
      facilityAddress: apiProfile?.addressLine || apiProfile?.city || "Address not provided",
      gstin: apiProfile?.gst || "Not provided",
      refNumber: invOrTx.refNumber || invOrTx.utr || "Not recorded",
      utr: invOrTx.utr,
      description: invOrTx.title || invOrTx.desc || invOrTx.description || "Clinical Staffing & Escrow Settlement",
      subtitle: invOrTx.subtitle || "Institutional clinical staffing, sourcing credits & escrow custody services",
      platformFee: invOrTx.platformFee ?? (invOrTx.platformFeePaise == null ? undefined : invOrTx.platformFeePaise / 100),
      subtotal: breakdown.subtotal,
      gst: breakdown.gst,
      total,
      status: invOrTx.status || breakdown.statusLabel,
      nodalAccount: invOrTx.destinationSnapshot || "Historical destination not recorded",
      transactionType: String(rawType),
      disbursedAt: invOrTx.bankDisbursedAt || invOrTx.disbursedAt,
      canonicalDocument: !!invOrTx.canonicalDocument,
      docType: breakdown.docType,
    };
  };

  const handleOpenInvoice = (invOrTx: any) => {
    const invData = prepareInvoiceData(invOrTx);
    setSelectedInvoice(invData);
  };

  const handleDownloadInvoice = (invOrTx: any) => {
    try {
      const invData = prepareInvoiceData(invOrTx);
      generateHospitalInvoicePdf(invData);
      const label = walletDocumentTitle(invData.transactionType, invData.status);
      toast.success(`${label} ${invData.invoiceId} downloaded successfully!`);
    } catch (err: any) {
      toast.error("Failed to download document", {
        description: err?.message || "Please preview the invoice first.",
      });
    }
  };

  // Modal Open Handlers with Bank Account Enforcement
  const handleOpenTopUp = () => {
    if (!hasLinkedBank) {
      toast.error("Hospital Settlement Bank Account Required", {
        description: "Link your institutional bank account and complete ownership review before submitting a deposit reference.",
      });
      setBankModalOpen(true);
      return;
    }
    setTopUpModalOpen(true);
  };

  const handleOpenBuyCredits = () => {
    if (!hasLinkedBank) {
      toast.error("Hospital Settlement Bank Account Required", {
        description: "Please link and verify your hospital bank account before purchasing sourcing credits. This is required for billing statements and payment reconciliation.",
      });
      setBankModalOpen(true);
      return;
    }
    setBuyCreditsModalOpen(true);
  };

  // Top Up Action
  const handleConfirmTopUp = async () => { await pageAction.run(async () => {
    if (!hasLinkedBank) {
      toast.error("Hospital Settlement Bank Account Required", {
        description: "Please link your hospital settlement bank account before depositing escrow funds.",
      });
      setTopUpModalOpen(false);
      setBankModalOpen(true);
      return;
    }

    const finalAmount = customTopUpInput ? Number(customTopUpInput) : selectedTopUpAmount;
    if (!finalAmount || finalAmount < 1000) {
      toast.error("Minimum top-up is ₹1,000");
      return;
    }

    setIsProcessing(true);

    {
      try {
        const utrGen = depositReference.trim().toUpperCase();
        if (!/^[A-Za-z0-9]{8,30}$/.test(utrGen)) { toast.error("Enter the actual bank transfer reference (8-30 letters or digits)."); setIsProcessing(false); return; }
        await topUpWallet(rupeesToPaise(finalAmount), utrGen, paymentMethod.toUpperCase());
        setIsProcessing(false);
        setTopUpModalOpen(false);
        setCustomTopUpInput("");
        toast.success("Deposit reference submitted", { description: "Your available balance stays unchanged until an admin verifies receipt of funds." });
        setDepositReference("");
        fetchWalletData();
      } catch (err: any) {
      pageLoad.fail(err);
        setIsProcessing(false);
        toast.error("Top-up deposit failed", {
          description: err?.message || "Could not process top-up.",
        });
      }
      return;
    }


  }); };

  // Buy Credits Action
  const handleConfirmBuyCredits = async () => { await pageAction.run(async () => {
    if (!hasLinkedBank) {
      toast.error("Hospital Settlement Bank Account Required", {
        description: "Please link your hospital settlement bank account before purchasing candidate credits.",
      });
      setBuyCreditsModalOpen(false);
      setBankModalOpen(true);
      return;
    }
    if (!selectedPkg) return;
    setIsProcessing(true);
    const priceNum = Number(selectedPkg.price.replace(/[^0-9]/g, ""));

    {
      try {
        await buyCandidateCredits(selectedPkg?.id, selectedPkg.credits, rupeesToPaise(priceNum));
        setIsProcessing(false);
        setBuyCreditsModalOpen(false);
        toast.success(`${selectedPkg.credits} Sourcing Credits activated`);
        fetchWalletData();
      } catch (err: any) {
      pageLoad.fail(err);
        setIsProcessing(false);
        toast.error("Credits purchase failed", {
          description: err?.message || "Ensure available balance is sufficient.",
        });
      }
      return;
    }


  }); };

  // Saving details starts manual ownership review.
  const handleSaveBankAccount = async (e: React.FormEvent) => { e.preventDefault(); await pageAction.run(async () => {
    if (!/^\d{9,18}$/.test(formAccNumber)) {
      toast.error("Please enter a valid bank account number");
      return;
    }
    if (formAccNumber !== formConfirmAcc) {
      toast.error("Account numbers do not match");
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formIfsc.toUpperCase())) {
      toast.error("Please enter a valid 11-character IFSC code");
      return;
    }


    setIsSavingBank(true);

    {
      try {
        const savedDto = await updateHospitalBankAccount({
          accountHolderName: formHolderName,
          bankName: formBankName,
          accountNumber: formAccNumber,
          ifsc: formIfsc.toUpperCase(),
          branch: formBranch || "",
          accountType: formAccType,
        });
        setApiBank(savedDto);
        setIsSavingBank(false);
        setBankModalOpen(false);
        toast.success("Hospital bank account details saved", {
          description: `Pending ownership verification: ${formHolderName} (${formBankName})`,
        });
        fetchWalletData();
        window.dispatchEvent(new CustomEvent("fale:wallet-updated"));
      } catch (err: any) {
      pageLoad.fail(err);
        setIsSavingBank(false);
        toast.error("Bank account verification failed", {
          description: err?.message || "Please check details and IFSC code.",
        });
      }
      return;
    }


  }); };

  return (
    <AppShell>
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
      <div className="max-w-7xl mx-auto space-y-6 pb-16 min-w-0">

        {/* Clean Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Wallet &amp; Escrow
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escrow custody, shift payouts, sourcing credits, linked bank account, and billing statements for {orgName}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenBuyCredits}
              className="rounded-xl text-xs font-semibold h-9 px-3.5 cursor-pointer gap-1.5 flex-1 sm:flex-initial justify-center"
            >
              <HiOutlineSparkles className="h-4 w-4 text-amber-500" />
              <span>Buy Credits</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenTopUp}
              className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs flex-1 sm:flex-initial justify-center"
            >
              <HiOutlinePlus className="h-4 w-4" />
              <span>Top Up Escrow</span>
            </Button>
          </div>
        </div>

        {/* 4 Professional KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {/* Card 1: Available Escrow */}
          <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                <HiOutlineBanknotes className="h-5 w-5" />
              </span>
              <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider shrink-0 border border-primary/20">
                Ready for shifts
              </span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Available Escrow
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                ₹{escrowBalance.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hospital custody reserve
              </p>
            </div>
          </div>

          {/* Card 2: Locked in Escrow */}
          <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                <HiOutlineLockClosed className="h-5 w-5" />
              </span>
              <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider shrink-0 border border-primary/20">
                {lockedShiftCount} awaiting bank payment
              </span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Locked in Shifts
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                ₹{lockedEscrow.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Includes reserved duties and pending settlements
              </p>
            </div>
          </div>

          {/* Card 3: Sourcing Credits */}
          <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                <HiOutlineSparkles className="h-5 w-5" />
              </span>
              <button
                type="button"
                onClick={handleOpenBuyCredits}
                className="rounded-md bg-primary hover:bg-primary-hover text-primary-foreground px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                + Recharge
              </button>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Sourcing Credits
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                {candidateCredits}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Contact unlocks
              </p>
            </div>
          </div>

          {/* Card 4: Lifetime Disbursed */}
          <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                <HiOutlineArrowTrendingUp className="h-5 w-5" />
              </span>
              <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider shrink-0 border border-primary/20">
                Recorded total
              </span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Total Disbursed
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                ₹{totalDisbursed.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time payments
              </p>
            </div>
          </div>
        </section>

        {/* Hospital Settlement & Payout Bank Account Strip */}
        {!hasLinkedBank ? (
          <section className="rounded-2xl border border-dashed border-border/80 bg-card p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary mt-0.5">
                  <HiOutlineBuildingLibrary className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-foreground">
                      Hospital Settlement &amp; Payout Bank Account
                    </h3>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                      Not Linked
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Link your hospital's official current account to enable reviewed institutional payments and wallet refunds.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => setBankModalOpen(true)}
                className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary/90 text-white shrink-0 shadow-xs cursor-pointer gap-1.5"
              >
                <HiOutlinePlus className="h-4 w-4" />
                <span>Enter Hospital Bank Details</span>
              </Button>
            </div>
          </section>
        ) : currentBank ? (
          <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineBuildingLibrary className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-foreground block">
                        Hospital Linked Bank Account
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-medium">
                        {currentBank.accountType} Account
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-primary bg-primary-soft border border-primary/25 px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                    {currentBank.status}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Active settlement account for escrow refunds, shift reimbursements, and payouts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs w-full lg:w-auto">
                <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Account No.</span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="font-semibold text-sm tracking-tight text-foreground truncate">
                      {showFullAcc
                        ? currentBank.accountNumber
                        : `•••• •••• ${currentBank.accountNumber.slice(-4)}`}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowFullAcc(!showFullAcc)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title={showFullAcc ? "Hide Account" : "Show Account"}
                      >
                        {showFullAcc ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentBank.accountNumber, "bankacc", "Account number")}
                        className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title="Copy Account Number"
                      >
                        {copiedKey === "bankacc" ? <HiOutlineCheck className="h-4 w-4 text-primary" /> : <HiOutlineDocumentDuplicate className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">IFSC</span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="font-semibold text-sm tracking-tight text-foreground">{currentBank.ifsc}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentBank.ifsc, "ifsc", "IFSC code")}
                      className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0 transition-colors"
                      title="Copy IFSC"
                    >
                      {copiedKey === "ifsc" ? <HiOutlineCheck className="h-4 w-4 text-primary" /> : <HiOutlineDocumentDuplicate className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Bank Name</span>
                  <span className="font-semibold text-sm tracking-tight text-foreground block mt-1 truncate">{currentBank.bankName}</span>
                </div>

                <div className="bg-muted/40 p-3 rounded-xl border border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Beneficiary</span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span
                      className="font-semibold text-sm tracking-tight text-foreground truncate"
                      title={currentBank.accountHolderName}
                    >
                      {currentBank.accountHolderName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          currentBank.accountHolderName,
                          "bene",
                          "Beneficiary name"
                        )
                      }
                      className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0 transition-colors"
                      title="Copy Beneficiary Name"
                    >
                      {copiedKey === "bene" ? (
                        <HiOutlineCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <HiOutlineDocumentDuplicate className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Ledger, Statements & Bank Account Management */}
        <section className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
          {/* Header Controls */}
          <div className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab Pills with Smooth Horizontal Mobile Scroll */}
            <div className="w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0 -mx-1 px-1">
              <div className="inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/60 min-w-max">
                {[
                  { id: "all", label: "All Transactions" },
                  { id: "shifts", label: "Shift Escrow & Payouts" },
                  { id: "credits", label: "Sourcing Credits" },
                  { id: "invoices", label: "Statements" },
                  { id: "bank", label: "Linked Hospital Bank" },
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
                    {tab.id === "bank" && (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          hasLinkedBank ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        title={hasLinkedBank ? "Bank account linked" : "No bank account linked"}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            {activeTab !== "bank" && (
              <div className="relative w-full sm:w-60 shrink-0">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={activeTab === "invoices" ? "Filter billing statements..." : "Filter transactions..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8.5 w-full rounded-xl border border-input bg-card pl-8 pr-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Clean Financial Ledger Table */}
          {activeTab !== "invoices" && activeTab !== "bank" && (
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Reference / UTR</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isCredit = tx.amount > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-medium">
                            {tx.date}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">{tx.title}</div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-xs">{tx.subtitle}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                            <div>{tx.refNumber}</div>
                            {tx.utr && <div className="text-[10px] text-muted-foreground/70">UTR: {tx.utr}</div>}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                                tx.status === "Completed"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : tx.status === "In Escrow"
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold">
                            <span
                              className={
                                isCredit
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-foreground"
                              }
                            >
                              {isCredit ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            {tx.invoiceId ? (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvoice(tx)}
                                  className="text-primary hover:underline font-mono text-[11px] font-bold cursor-pointer"
                                  title="View wallet statement"
                                >
                                  {tx.invoiceId}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoice(tx)}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                  title="Download PDF Invoice"
                                >
                                  <HiOutlineDocumentArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Clean Dynamic Statements Table */}
          {activeTab === "invoices" && (
            <div>
              <div className="px-4 py-3 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>GST is shown from recorded transaction amounts. Shift GST applies to the platform fee only.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast.info("This action is unavailable until the service is connected. No changes were made.")}
                  className="h-7 text-xs text-primary font-semibold hover:bg-muted cursor-pointer"
                >
                  Email Annual Statement
                </Button>
              </div>

              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Service Description</th>
                      <th className="py-3 px-4 text-right">Amount before GST</th>
                      <th className="py-3 px-4 text-right">GST recorded</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground font-medium">
                          No billing statements match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoice(inv)}
                              className="font-mono font-bold text-primary hover:underline cursor-pointer"
                              title="Click to preview settlement statement"
                            >
                              {inv.id}
                            </button>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-medium">
                            {inv.month}
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            <div>{inv.desc}</div>
                            {inv.subtitle && (
                              <div className="text-[10px] text-muted-foreground truncate max-w-xs">{inv.subtitle}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-muted-foreground">
                            ₹{inv.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-muted-foreground">
                            ₹{inv.gst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-foreground">
                            ₹{inv.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleOpenInvoice(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-semibold cursor-pointer transition-all"
                                title="View printable invoice receipt"
                              >
                                <HiOutlinePrinter className="h-3.5 w-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(inv)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold cursor-pointer transition-all shadow-2xs"
                                title="Download wallet statement"
                              >
                                <HiOutlineDocumentArrowDown className="h-3.5 w-3.5" />
                                <span>PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Linked Hospital Bank Account & Cancelled Cheque Management */}
          {activeTab === "bank" && (
            <div className="p-4 sm:p-6 space-y-6">
              {!hasLinkedBank ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center space-y-4">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <HiOutlineBuildingLibrary className="h-7 w-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-foreground">No Settlement Bank Account Linked</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Link your hospital's official current account to enable reviewed institutional payments and wallet refunds.
                    </p>
                  </div>
                  <div>
                    <Button
                      size="sm"
                      onClick={() => setBankModalOpen(true)}
                      className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
                    >
                      <HiOutlinePlus className="h-4 w-4 mr-1.5" />
                      Link Hospital Bank Account
                    </Button>
                  </div>
                </div>
              ) : currentBank ? (
                <>
                  {/* Top Banner with Penny Drop Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border border-border/70">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <HiOutlineShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-foreground">
                        Hospital Settlement &amp; Refund Account
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        <HiOutlineCheckBadge className="h-3.5 w-3.5" />
                        <span>{currentBank.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                      Linked current account for reviewed institutional payments and wallet refunds.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBankModalOpen(true)}
                  className="rounded-xl text-xs font-semibold h-9 px-3.5 shrink-0 gap-1.5 cursor-pointer"
                >
                  <HiOutlinePencilSquare className="h-4 w-4" />
                  <span>Update Bank Account</span>
                </Button>
              </div>

              {/* 2-Column Institutional Bank Account Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left (7 cols): Verified Bank Account Details */}
                <div className="md:col-span-7 rounded-2xl border border-border/70 bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/50 pb-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Account Particulars
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {currentBank.accountType} Account
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">Bank Name</span>
                      <span className="text-sm font-bold text-foreground mt-0.5 block">{currentBank.bankName}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">Account Holder Entity</span>
                      <span className="text-xs font-bold text-foreground mt-0.5 block truncate">{currentBank.accountHolderName}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">Account Number</span>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-sm font-bold text-foreground">
                        <span>
                          {showFullAcc
                            ? currentBank.accountNumber
                            : `•••• •••• ${currentBank.accountNumber.slice(-4)}`}
                        </span>

                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">IFSC Code &amp; Branch</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-xs text-foreground">{currentBank.ifsc}</span>
                        <span className="text-muted-foreground text-[11px] truncate">· {currentBank.branch}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Verification status: <strong>{currentBank.status}</strong></span>
                    <span className="font-mono text-[10px]">Verification evidence is recorded by the reviewing admin.</span>
                  </div>
                </div>

                {/* Right (5 cols): Uploaded Cancelled Cheque / Bank Mandate Document */}
                <div className="md:col-span-5 rounded-2xl border border-border/70 bg-card p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="rounded-xl border p-4 text-sm"><p className="font-semibold">Ownership review</p><p className="mt-2 text-xs text-muted-foreground">Current status: {currentBank.status}. Verification evidence is checked by an admin. No cheque document is available to preview here.</p></div>
                  </div>

                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
        </section>

      </div>

      {/* MODAL 1: Top Up Escrow Reserve */}
      <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Top Up Escrow Reserve
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Submit a real bank transfer arranged with billing. An admin must reconcile receipt before funds become available to {orgName}.
            </DialogDescription>
          </DialogHeader>

          {/* Amount selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Select amount</label>
            <div className="grid grid-cols-4 gap-2">
              {[10000, 25000, 50000, 100000].map((amt) => {
                const isSelected = selectedTopUpAmount === amt && !customTopUpInput;
                return (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => {
                      setSelectedTopUpAmount(amt);
                      setCustomTopUpInput("");
                    }}
                    className={cn(
                      "py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer font-mono font-bold text-xs",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    ₹{amt / 1000}k
                  </button>
                );
              })}
            </div>

            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                min={1000}
                placeholder="Or custom amount (Min. ₹1,000)"
                value={customTopUpInput}
                onChange={(e) => {
                  setCustomTopUpInput(e.target.value);
                  setSelectedTopUpAmount(0);
                }}
                className="h-10 w-full rounded-xl border border-input bg-card pl-7 pr-3 text-xs font-bold text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Payment method</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: "upi", label: "UPI" },
                { id: "netbanking", label: "NetBanking" },
                { id: "neft", label: "NEFT / RTGS" },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as typeof paymentMethod)}
                  className={cn(
                    "p-2.5 rounded-xl border text-center font-medium transition-all cursor-pointer",
                    paymentMethod === m.id
                      ? "border-primary bg-primary/5 text-primary font-bold"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-semibold">Actual bank transfer reference
            <input aria-label="Bank transfer reference" value={depositReference} onChange={event => setDepositReference(event.target.value)} autoComplete="off" maxLength={30} className="mt-1 w-full rounded-xl border bg-background p-2.5" />
          </label>
          <p className="text-xs text-muted-foreground">Submitting a reference does not credit your wallet or initiate a transfer.</p>
          {/* Modal Actions */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-[10px] text-muted-foreground block">Deposit Amount</span>
              <span className="text-base font-bold font-mono text-foreground">
                ₹{(customTopUpInput ? Number(customTopUpInput) : selectedTopUpAmount).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTopUpModalOpen(false)}
                className="rounded-xl text-xs font-medium h-9 px-3.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={pageAction.isPending || (isProcessing)}
                onClick={handleConfirmTopUp}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer bg-primary hover:bg-primary-hover shadow-2xs"
              >
                {isProcessing ? "Processing..." : "Submit for reconciliation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Candidate Sourcing Credits */}
      <Dialog open={buyCreditsModalOpen} onOpenChange={setBuyCreditsModalOpen}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Candidate Sourcing Credits
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Unlock verified clinician telephone numbers and detailed CVs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {creditPackages.map((pkg) => {
              const isSelected = selectedPkg?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={cn(
                    "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:bg-muted/30"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{pkg.name}</span>
                      {pkg.popular && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                          Popular
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{pkg.credits} Unlocks · {pkg.perCredit}</span>
                  </div>

                  <span className="text-sm font-bold font-mono text-foreground">
                    {pkg.price}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-[10px] text-muted-foreground block">Total Payable</span>
              <span className="text-base font-bold font-mono text-foreground">
                {selectedPkg?.price}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBuyCreditsModalOpen(false)}
                className="rounded-xl text-xs font-medium h-9 px-3.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={pageAction.isPending || (isProcessing)}
                onClick={handleConfirmBuyCredits}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer bg-primary hover:bg-primary-hover shadow-2xs"
              >
                {isProcessing ? "Activating..." : "Activate Credits"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Update Hospital Bank Account & Upload Cancelled Cheque */}
      <Dialog open={bankModalOpen} onOpenChange={setBankModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[88vh] flex flex-col rounded-2xl border-border/80 shadow-lg">
          {/* Fixed Header */}
          <DialogHeader className="p-5 border-b border-border/60 shrink-0 text-left space-y-1 bg-card">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <HiOutlineBuildingLibrary className="h-4.5 w-4.5" />
              </span>
              <DialogTitle className="text-lg font-bold text-foreground">
                Hospital settlement account
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter your institutional account details for manual ownership review.
            </DialogDescription>
          </DialogHeader>

          {/* Form with Scrollable Content and Sticky Footer */}
          <form onSubmit={handleSaveBankAccount} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto scrollbar-none p-5 space-y-3.5 flex-1">
              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Beneficiary / Entity Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formHolderName}
                  onChange={(e) => setFormHolderName(e.target.value)}
                  placeholder={`e.g. ${orgName} Private Limited`}
                  className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <p className="text-[10px] text-muted-foreground">
                  Must match the name on your hospital PAN and Cancelled Cheque.
                </p>
              </div>

              {/* Bank Name & Account Type with Custom Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      <SelectItem value="ICICI Bank" className="text-xs">ICICI Bank</SelectItem>
                      <SelectItem value="State Bank of India" className="text-xs">State Bank of India</SelectItem>
                      <SelectItem value="Axis Bank" className="text-xs">Axis Bank</SelectItem>
                      <SelectItem value="Kotak Mahindra Bank" className="text-xs">Kotak Mahindra Bank</SelectItem>
                      <SelectItem value="Other Commercial Bank" className="text-xs">Other Commercial Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Account Type <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formAccType}
                    onValueChange={(val) => setFormAccType(val as "Current" | "Escrow Sub-Account")}
                  >
                    <SelectTrigger className="h-9.5 rounded-xl border-input bg-card px-3 text-xs font-medium">
                      <SelectValue placeholder="Select Account Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Current" className="text-xs">Current Account</SelectItem>
                      <SelectItem value="Escrow Sub-Account" className="text-xs">Corporate Escrow Sub-Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Account Number & Confirm Account Number */}
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
                    placeholder="e.g. 50200084920194"
                    className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Confirm Account Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formConfirmAcc}
                    onChange={(e) => setFormConfirmAcc(e.target.value)}
                    placeholder="Re-enter Account Number"
                    className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>

              {/* IFSC & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    placeholder="e.g. Koramangala, Bengaluru"
                    className="h-9.5 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>

              <p className="rounded-xl border p-3 text-xs text-muted-foreground">Saving details starts a manual ownership review. An admin checks supporting evidence separately before marking the account verified.</p>
            </div>

            {/* Sticky Modal Actions Bar (Always Visible!) */}
            <div className="p-4 border-t border-border/60 bg-muted/20 shrink-0 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline-block">
                Account ownership review
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBankModalOpen(false)}
                  className="rounded-xl text-xs font-medium h-9 px-3.5 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isSavingBank}
                  loadingText="Saving bank details..."
                  className="rounded-xl text-xs font-semibold h-9 px-4.5 cursor-pointer bg-primary hover:bg-primary-hover shadow-2xs gap-1.5"
                >
                  <HiOutlineCheck className="h-4 w-4" />
                  <span>Save for review</span>
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Printable Official Tax Invoice & Escrow Settlement Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden max-h-[92vh] flex flex-col rounded-2xl border-border/80 shadow-2xl bg-background">
          <div className="py-3 px-4 sm:px-6 pr-12 border-b border-border/60 bg-muted/40 flex items-center justify-between shrink-0 print:hidden min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <HiOutlineDocumentText className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                  {walletDocumentTitle(selectedInvoice?.transactionType,selectedInvoice?.status)}
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono truncate block">
                  {selectedInvoice?.docType === "CREDIT_NOTE" ? "Credit Note #:" : "Invoice #:"} {selectedInvoice?.invoiceId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedInvoice && printHospitalInvoicePdf(selectedInvoice)}
                className="h-8 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <HiOutlinePrinter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedInvoice) {
                    handleDownloadInvoice(selectedInvoice);
                  }
                }}
                className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer"
              >
                <HiOutlineDocumentArrowDown className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto scrollbar-none p-3 sm:p-6 flex-1 bg-muted/15">
            {selectedInvoice && (
              <div className="bg-card text-foreground rounded-2xl border border-border/80 p-5 sm:p-8 shadow-xs space-y-6 max-w-2xl mx-auto text-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/80 pb-5">
                  <div className="space-y-1">
                    <Logo />
                    <div className="text-[10px] text-muted-foreground leading-relaxed pt-1">
                      <p className="font-bold text-foreground/90">THE FALE</p>
                      <p>Healthcare Staffing &amp; Wallet Records</p>
                      <p>Recorded wallet amounts and fee/GST breakdown</p>
                      <p>Issuer particulars available from billing • billing@thefale.com</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1 shrink-0">
                    <span className={`inline-block text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg border ${
                      selectedInvoice.docType === "CREDIT_NOTE"
                        ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}>
                      {walletDocumentTitle(selectedInvoice.transactionType,selectedInvoice.status)}
                    </span>
                    <div className="font-mono text-xs font-bold text-foreground mt-1 break-all">
                      {selectedInvoice.invoiceId}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Date: <span className="font-medium text-foreground">{selectedInvoice.date}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Route: <span className="font-medium text-foreground">Hospital wallet</span>
                    </p>
                  </div>
                </div>

                {/* Status banner */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs ${
                  selectedInvoice.docType === "CREDIT_NOTE"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                }`}>
                  <div className="flex items-center gap-2">
                    <HiOutlineCheckBadge className={`h-4 w-4 shrink-0 ${
                      selectedInvoice.docType === "CREDIT_NOTE"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`} />
                    <div>
                      <span className="font-bold block">
                        {selectedInvoice.status}
                      </span>
                      <span className="text-[11px] opacity-85">
                        {selectedInvoice.status === "Completed" || selectedInvoice.status === "Refunded" ? "Recorded wallet transaction" : "Not proof of payment or receipt of funds"}
                      </span>
                    </div>
                  </div>
                  <div className={`font-mono text-[11px] bg-background/90 px-2.5 py-1 rounded-lg border font-bold ${
                    selectedInvoice.docType === "CREDIT_NOTE" ? "border-amber-500/30" : "border-emerald-500/30"
                  }`}>
                    Ref: {selectedInvoice.refNumber}
                  </div>
                </div>

                {/* Two columns: Billed to & Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Billed To (Hospital)</span>
                    <p className="text-sm font-bold text-foreground">{selectedInvoice.hospitalName}</p>
                    <p className="text-[11px] text-muted-foreground">GSTIN: {selectedInvoice.gstin || "Not provided"}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedInvoice.facilityAddress}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Settlement Account</span>
                    <p className="text-xs font-mono font-bold text-foreground">
                      {selectedInvoice.nodalAccount || "Historical destination not recorded"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {selectedInvoice.disbursedAt ? `Bank disbursed: ${new Date(selectedInvoice.disbursedAt).toLocaleString("en-IN")}` : "Bank disbursement date not recorded"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Period: {selectedInvoice.period}</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-border/70 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/60 font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Service Description</th>
                        <th className="py-2.5 px-3">Platform fee</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-3 text-right">GST on fee</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="py-3 px-3">
                          <p className="font-bold text-foreground">{selectedInvoice.description}</p>
                          <p className="text-[10px] text-muted-foreground">{selectedInvoice.subtitle}</p>
                        </td>
                        <td className="py-3 px-3 font-mono text-muted-foreground">{selectedInvoice.platformFee == null ? "Not recorded" : selectedInvoice.platformFee.toLocaleString("en-IN", {minimumFractionDigits:2})}</td>
                        <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                          ₹{selectedInvoice.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                          ₹{selectedInvoice.gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                          ₹{selectedInvoice.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Financial Totals */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
                  <div className="space-y-1 text-[11px] text-muted-foreground max-w-xs">
                    <p className="font-semibold text-foreground">Recorded fee and GST</p>
                    <p>GST is recorded on the platform fee only. This wallet statement is not a statutory tax invoice.</p>
                    {!selectedInvoice.canonicalDocument && <p>Historical record: reconciliation may not be recorded.</p>}
                    {selectedInvoice.disbursedAt && <p>Bank disbursed: {new Date(selectedInvoice.disbursedAt).toLocaleString("en-IN")}</p>}

                  </div>

                  <div className="w-full sm:w-72 space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60 font-mono text-xs">
                    <div className="flex justify-between gap-3 text-muted-foreground"><span>{selectedInvoice.transactionType === "disbursement" || selectedInvoice.transactionType === "escrow_hold" ? "Base shift amount:" : "Base amount:"}</span><span className="text-right whitespace-nowrap">{recordedBaseAmount(selectedInvoice.subtotal, selectedInvoice.platformFee)?.toLocaleString("en-IN", {style:"currency",currency:"INR"}) ?? "Not recorded"}</span></div>
                    <div className="flex justify-between gap-3 text-muted-foreground"><span>Platform fee:</span><span className="text-right whitespace-nowrap">{selectedInvoice.platformFee == null ? "Not recorded" : selectedInvoice.platformFee.toLocaleString("en-IN",{style:"currency",currency:"INR"})}</span></div>
                    <div className="flex justify-between gap-3 text-muted-foreground"><span>Subtotal before GST:</span><span className="text-right whitespace-nowrap">{selectedInvoice.subtotal.toLocaleString("en-IN",{style:"currency",currency:"INR"})}</span></div>
                    <div className="flex justify-between gap-3 text-muted-foreground"><span>GST on platform fee:</span><span className="text-right whitespace-nowrap">{selectedInvoice.gst.toLocaleString("en-IN",{style:"currency",currency:"INR"})}</span></div>
                    <div className="border-t border-border/70 pt-1.5 flex justify-between font-bold text-sm text-foreground">
                      <span>
                        Total recorded:
                      </span>
                      <span className="text-primary">₹{selectedInvoice.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Legal & Seal */}
                <div className="pt-4 border-t border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
                  <p>System-generated wallet statement. Formal tax invoice available from billing.</p>
                  <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    FALE WALLET RECORD
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </AppShell>
  );
}
