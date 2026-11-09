import { useState, useEffect, useMemo, useRef } from "react";
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
        content: "Hospital escrow reserve balance, shift disbursements, sourcing credits, linked bank account, and GST tax invoices.",
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

const mockTaxInvoices = [
  { id: "INV-2026-1049", month: "Oct 2026", desc: "Shift Escrow & Locum Staffing Services", subtotal: 44237, gst: 7963, total: 52200, date: "30 Oct 2026", status: "Paid" },
  { id: "INV-2026-1038", month: "Oct 2026", desc: "Candidate Sourcing Credits (Growth Pack)", subtotal: 4236, gst: 763, total: 4999, date: "28 Oct 2026", status: "Paid" },
  { id: "INV-2026-0994", month: "Sep 2026", desc: "Per-Diem Emergency Coverage Settlement", subtotal: 38136, gst: 6864, total: 45000, date: "30 Sep 2026", status: "Paid" },
  { id: "INV-2026-0881", month: "Aug 2026", desc: "ICU Specialist Coverage Settlement", subtotal: 31356, gst: 5644, total: 37000, date: "31 Aug 2026", status: "Paid" },
];

function EmployerWalletPage() {
  const store = useApp();
  const [activeTab, setActiveTab] = useState<"all" | "shifts" | "credits" | "invoices" | "bank">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showFullAcc, setShowFullAcc] = useState(false);

  // Modals
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
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
    if (!isApiEnabled) return;
    setLoading(true);
    Promise.all([
      getFacilityWallet().catch(() => null),
      getWalletTransactions().catch(() => []),
      getHospitalBankAccount().catch(() => null),
      getFacilityProfile().catch(() => null),
    ])
      .then(([wallet, txs, bank, prof]) => {
        setApiWallet(wallet);
        setApiTransactions(txs);
        setApiBank(bank);
        if (prof) {
          setApiProfile(prof);
          if (prof.hospitalName && store.profile?.org !== prof.hospitalName) {
            setState((s) => ({
              ...s,
              profile: {
                ...s.profile,
                org: prof.hospitalName,
                hospitalName: prof.hospitalName,
                city: prof.city || s.profile.city,
              },
            }));
          }
        }
      })
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
  }, []);

  // Top Up State
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState<number>(25000);
  const [customTopUpInput, setCustomTopUpInput] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "netbanking" | "neft">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(creditPackages[1]);

  // Bank Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orgName = isApiEnabled
    ? apiProfile?.hospitalName || String(store.profile["org"] || store.profile["hospitalName"] || (store as any)?.facilityProfile?.hospitalName || "Healthcare Facility")
    : String(store.profile["org"] || "Apollo Hospitals — Main Campus");
  const defaultHolder = store.hospitalBankAccount?.accountHolderName && !store.hospitalBankAccount.accountHolderName.includes("Apollo")
    ? store.hospitalBankAccount.accountHolderName
    : `${orgName} Private Limited`;

  const currentBank: HospitalBankAccount | null = isApiEnabled && apiBank && (apiBank.accountNumber || apiBank.accountNumberMasked || apiBank.accountNumberLast4) ? {
    bankName: apiBank.bankName || "Current Bank",
    accountNumber: apiBank.accountNumber || apiBank.accountNumberMasked || (apiBank.accountNumberLast4 ? `•••• •••• ${apiBank.accountNumberLast4}` : ""),
    ifsc: apiBank.ifsc || apiBank.ifscCode || "",
    accountType: (apiBank.accountType as any) || "Current",
    accountHolderName: apiBank.accountHolderName || defaultHolder,
    branch: apiBank.branch || "Central Corporate Branch",
    status: apiBank.status || apiBank.verificationStatus || "Verified",
    documentName: "Hospital_Bank_Mandate.pdf",
    documentDate: apiBank.verifiedAt ? new Date(apiBank.verifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Active",
    verifiedAt: "Cashfree Penny Drop Verified",
  } : store.hospitalBankAccount || null;

  const hasLinkedBank = Boolean(currentBank && currentBank.accountNumber && currentBank.accountNumber.length > 3);

  const [formHolderName, setFormHolderName] = useState(defaultHolder);
  const [formBankName, setFormBankName] = useState(currentBank?.bankName || "HDFC Bank Ltd");
  const [formAccNumber, setFormAccNumber] = useState(currentBank?.accountNumber || "");
  const [formConfirmAcc, setFormConfirmAcc] = useState(currentBank?.accountNumber || "");
  const [formIfsc, setFormIfsc] = useState(currentBank?.ifsc || "");
  const [formBranch, setFormBranch] = useState(currentBank?.branch || "");
  const [formAccType, setFormAccType] = useState<"Current" | "Escrow Sub-Account">(currentBank?.accountType || "Current");
  const [formChequeFile, setFormChequeFile] = useState<string>(currentBank?.documentName || "Cancelled_Cheque_Hospital.pdf");
  const [isVerifyingPenny, setIsVerifyingPenny] = useState(false);

  const escrowBalance = isApiEnabled
    ? (apiWallet ? paiseToRupees(apiWallet.availableBalancePaise) : 0)
    : (store.escrowBalance ?? 0);
  const lockedEscrow = isApiEnabled
    ? (apiWallet ? paiseToRupees(apiWallet.lockedEscrowBalancePaise) : 0)
    : (store.lockedEscrow ?? 0);
  const candidateCredits = isApiEnabled
    ? (apiWallet ? apiWallet.candidateCredits : 0)
    : (store.candidateCredits ?? 0);
  const totalDisbursed = isApiEnabled
    ? (apiWallet ? paiseToRupees(apiWallet.totalDisbursedPaise || 0) : 0)
    : (store.totalDisbursed ?? 0);

  const lockedShiftCount = isApiEnabled
    ? (lockedEscrow > 0 ? Math.max(1, Math.round(lockedEscrow / 5000)) : 0)
    : (lockedEscrow > 0 ? 2 : 0);

  const hospitalCode = (store.profile?.hospitalCode || store.profile?.id || "99418290")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8)
    .toUpperCase();

  const virtualAccount = apiWallet?.facilityId
    ? `FALEHOSP${apiWallet.facilityId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}`
    : `FALEHOSP${hospitalCode}`;

  const dynamicInvoices = useMemo(() => {
    // 1. If backend API transactions exist, derive real tax invoices
    if (isApiEnabled && apiTransactions.length > 0) {
      const billable = apiTransactions.filter(
        (tx) => tx.invoiceId || tx.type?.toLowerCase().includes("credit") || tx.type?.toLowerCase().includes("topup") || tx.type?.toLowerCase().includes("refund") || tx.type?.toLowerCase().includes("disburs")
      );
      if (billable.length > 0) {
        return billable.map((tx) => {
          const totalPaise = Math.abs(tx.amountPaise || 0);
          const total = totalPaise > 0 ? paiseToRupees(totalPaise) : 1999;
          const subtotal = Math.round((total / 1.18) * 100) / 100;
          const gst = Math.round((total - subtotal) * 100) / 100;
          const dateObj = tx.createdAt ? new Date(tx.createdAt) : new Date();
          const month = dateObj.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
          const dateStr = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
          const invId = tx.invoiceId || `INV-2026-${tx.id.replace(/[^0-9a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "8483"}`;
          return {
            id: invId,
            month,
            desc: tx.title || "Clinical Staffing & Escrow Settlement",
            subtotal,
            gst,
            total,
            date: dateStr,
            status: tx.status === "COMPLETED" ? "Paid" : "Completed",
            refNumber: tx.refNumber || tx.utr || "CRD-FALE-TXN",
            utr: tx.utr,
            subtitle: tx.subtitle || "Institutional clinical staffing, sourcing credits & escrow custody services",
          };
        });
      }
    }

    // 2. If store transactions exist in client state
    if (store.walletTransactions && store.walletTransactions.length > 0) {
      const billable = store.walletTransactions.filter(
        (tx) => tx.invoiceId || tx.type === "credit_purchase" || tx.type === "topup" || tx.type === "refund" || tx.type === "disbursement"
      );
      if (billable.length > 0) {
        return billable.map((tx) => {
          const total = Math.max(1, Math.abs(tx.amount || 0));
          const subtotal = Math.round((total / 1.18) * 100) / 100;
          const gst = Math.round((total - subtotal) * 100) / 100;
          const invId = tx.invoiceId || `INV-2026-${(tx.id || "").replace(/[^0-9a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "8483"}`;
          return {
            id: invId,
            month: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
            desc: tx.title || "Clinical Staffing & Escrow Settlement",
            subtotal,
            gst,
            total,
            date: tx.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            status: tx.status === "Completed" ? "Paid" : "Completed",
            refNumber: tx.refNumber || tx.utr || "CRD-FALE-TXN",
            utr: tx.utr,
            subtitle: tx.subtitle || "Institutional clinical staffing, sourcing credits & escrow custody services",
          };
        });
      }
    }

    return mockTaxInvoices;
  }, [isApiEnabled, apiTransactions, store.walletTransactions]);

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
    if (isApiEnabled) {
      return apiTransactions.map((tx) => {
        const rawType = (tx.type || "").toLowerCase();
        let mappedType: WalletTransaction["type"] = "escrow_hold";
        if (rawType.includes("topup")) mappedType = "topup";
        else if (rawType.includes("credit")) mappedType = "credit_purchase";
        else if (rawType.includes("refund")) mappedType = "refund" as any;
        else if (rawType.includes("disburs")) mappedType = "disbursement";

        const invId = tx.invoiceId || `INV-2026-${tx.id.replace(/[^0-9a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "8483"}`;

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
            : "Recent",
          status: (tx.status?.toUpperCase() === "COMPLETED" ? "Completed" : tx.status?.toUpperCase() === "PENDING" ? "Processing" : "Completed") as any,
          refNumber: tx.refNumber || tx.utr || "TXN-FALE-99214",
          invoiceId: invId,
          utr: tx.utr,
        };
      });
    }
    return store.walletTransactions ?? [];
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

  const handleCopy = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const prepareInvoiceData = (invOrTx: any): HospitalInvoicePdfData => {
    const isTx = "amount" in invOrTx || "amountPaise" in invOrTx;
    const rawAmount = "amountPaise" in invOrTx
      ? paiseToRupees(invOrTx.amountPaise)
      : "amount" in invOrTx
        ? invOrTx.amount
        : invOrTx.total;
    const total = Math.max(1, Math.abs(Number(rawAmount) || 0));
    const subtotal = Math.round((total / 1.18) * 100) / 100;
    const gst = Math.round((total - subtotal) * 100) / 100;
    const invId = invOrTx.invoiceId || invOrTx.id || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      invoiceId: invId,
      date: invOrTx.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      period: invOrTx.month || invOrTx.period || new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      hospitalName: String(store.profile["org"] || (isApiEnabled ? "Healthcare Facility" : "Apollo Hospitals")),
      facilityAddress: "Accredited Hospital Network & Clinical Campus, India",
      gstin: "29AABCT1332L1Z4",
      refNumber: invOrTx.refNumber || invOrTx.utr || "CRD-FALE-TXN",
      utr: invOrTx.utr,
      description: invOrTx.title || invOrTx.desc || invOrTx.description || "Clinical Staffing & Escrow Settlement",
      subtitle: invOrTx.subtitle || "Institutional clinical staffing, sourcing credits & escrow custody services",
      subtotal,
      gst,
      total,
      status: (invOrTx.status || "Paid").toUpperCase() === "PENDING" ? "Processing" : "Paid",
      nodalAccount: virtualAccount,
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
      toast.success(`Tax invoice ${invData.invoiceId} downloaded successfully!`);
    } catch (err: any) {
      toast.error("Failed to download tax invoice", {
        description: err?.message || "Please preview the invoice first.",
      });
    }
  };

  // Modal Open Handlers with Bank Account Enforcement
  const handleOpenTopUp = () => {
    if (!hasLinkedBank) {
      toast.error("Hospital Settlement Bank Account Required", {
        description: "Please link and verify your hospital bank account before topping up escrow. This is required for RBI escrow custody and automated refunds.",
      });
      setBankModalOpen(true);
      return;
    }
    setTopUpModalOpen(true);
  };

  const handleOpenBuyCredits = () => {
    if (!hasLinkedBank) {
      toast.error("Hospital Settlement Bank Account Required", {
        description: "Please link and verify your hospital bank account before purchasing sourcing credits. This is required for tax invoices and payment reconciliation.",
      });
      setBankModalOpen(true);
      return;
    }
    setBuyCreditsModalOpen(true);
  };

  // Top Up Action
  const handleConfirmTopUp = async () => {
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

    if (isApiEnabled) {
      try {
        const utrGen = `UTR${Date.now().toString().slice(-10)}`;
        await topUpWallet(rupeesToPaise(finalAmount), utrGen, paymentMethod.toUpperCase());
        setIsProcessing(false);
        setTopUpModalOpen(false);
        setCustomTopUpInput("");
        toast.success(`₹${finalAmount.toLocaleString("en-IN")} deposited to Escrow Reserve`);
        fetchWalletData();
      } catch (err: any) {
        setIsProcessing(false);
        toast.error("Top-up deposit failed", {
          description: err?.message || "Could not process top-up.",
        });
      }
      return;
    }

    setTimeout(() => {
      setIsProcessing(false);
      const newTxId = "tx-" + Date.now().toString().slice(-4);
      const newTx: WalletTransaction = {
        id: newTxId,
        type: "topup",
        title: "Escrow Top-Up",
        subtitle: `${paymentMethod === "upi" ? "Corporate UPI" : paymentMethod === "netbanking" ? "Corporate NetBanking" : "NEFT/RTGS Transfer"} • ${orgName}`,
        amount: finalAmount,
        date: "Just now",
        status: "Completed",
        refNumber: `TXN-FALE-${Math.floor(10000 + Math.random() * 90000)}`,
        invoiceId: `INV-2026-${Math.floor(1050 + Math.random() * 100)}`,
        utr: `UTR${Date.now().toString().slice(-10)}`,
      };

      setState((s) => ({
        escrowBalance: (s.escrowBalance ?? 185000) + finalAmount,
        walletTransactions: [newTx, ...(s.walletTransactions ?? [])],
      }));

      setTopUpModalOpen(false);
      setCustomTopUpInput("");
      toast.success(`₹${finalAmount.toLocaleString("en-IN")} deposited to Escrow Reserve`);
    }, 600);
  };

  // Buy Credits Action
  const handleConfirmBuyCredits = async () => {
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

    if (isApiEnabled) {
      try {
        await buyCandidateCredits(selectedPkg.id, selectedPkg.credits, rupeesToPaise(priceNum));
        setIsProcessing(false);
        setBuyCreditsModalOpen(false);
        toast.success(`${selectedPkg.credits} Sourcing Credits activated`);
        fetchWalletData();
      } catch (err: any) {
        setIsProcessing(false);
        toast.error("Credits purchase failed", {
          description: err?.message || "Ensure available balance is sufficient.",
        });
      }
      return;
    }

    setTimeout(() => {
      setIsProcessing(false);
      const newTxId = "tx-" + Date.now().toString().slice(-4);
      const newTx: WalletTransaction = {
        id: newTxId,
        type: "credit_purchase",
        title: `Sourcing Credits (${selectedPkg.name})`,
        subtitle: `${selectedPkg.credits} candidate contact unlocks`,
        amount: -priceNum,
        date: "Just now",
        status: "Completed",
        refNumber: `CRD-FALE-${Math.floor(10000 + Math.random() * 90000)}`,
        invoiceId: `INV-2026-${Math.floor(1050 + Math.random() * 100)}`,
      };

      setState((s) => ({
        candidateCredits: (s.candidateCredits ?? 0) + selectedPkg.credits,
        walletTransactions: [newTx, ...(s.walletTransactions ?? [])],
      }));

      setBuyCreditsModalOpen(false);
      toast.success(`${selectedPkg.credits} Sourcing Credits activated`);
    }, 500);
  };

    // Cheque Upload Trigger
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormChequeFile(file.name);
      toast.success(`Attached cancelled cheque: ${file.name}`);
    }
  };

  // Penny Drop Verification
  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAccNumber || formAccNumber.length < 8) {
      toast.error("Please enter a valid bank account number");
      return;
    }
    if (formAccNumber !== formConfirmAcc) {
      toast.error("Account numbers do not match");
      return;
    }
    if (!formIfsc || formIfsc.length < 11) {
      toast.error("Please enter a valid 11-character IFSC code");
      return;
    }
    if (!formChequeFile) {
      toast.error("Please upload a cancelled cheque or bank mandate document");
      return;
    }

    setIsVerifyingPenny(true);

    if (isApiEnabled) {
      try {
        const savedDto = await updateHospitalBankAccount({
          accountHolderName: formHolderName,
          bankName: formBankName,
          accountNumber: formAccNumber,
          ifsc: formIfsc.toUpperCase(),
          branch: formBranch || "Central Corporate Branch",
          accountType: formAccType,
        });
        setApiBank(savedDto);
        setIsVerifyingPenny(false);
        setBankModalOpen(false);
        toast.success("Hospital Bank Account Verified via Cashfree Penny Drop!", {
          description: `Name match confirmed: ${formHolderName} (${formBankName})`,
        });
        fetchWalletData();
        window.dispatchEvent(new CustomEvent("fale:wallet-updated"));
      } catch (err: any) {
        setIsVerifyingPenny(false);
        toast.error("Bank account verification failed", {
          description: err?.message || "Please check details and IFSC code.",
        });
      }
      return;
    }

    setTimeout(() => {
      setIsVerifyingPenny(false);
      const updatedBank: HospitalBankAccount = {
        bankName: formBankName,
        accountNumber: formAccNumber,
        ifsc: formIfsc.toUpperCase(),
        accountType: formAccType,
        accountHolderName: formHolderName,
        branch: formBranch || "Central Branch",
        status: "Verified",
        documentName: formChequeFile,
        documentDate: "Just now",
        verifiedAt: "Cashfree ₹1 Penny Drop Verified",
      };

      setState(() => ({
        hospitalBankAccount: updatedBank,
      }));

      setBankModalOpen(false);
      toast.success("Bank Account Verified via Cashfree Penny Drop!", {
        description: `Name match confirmed: ${formHolderName} (${formBankName})`,
      });
      window.dispatchEvent(new CustomEvent("fale:wallet-updated"));
    }, 1200);
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-16 min-w-0">
        
        {/* Clean Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Wallet &amp; Escrow
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escrow custody, shift payouts, sourcing credits, linked bank account, and tax invoices for {orgName}
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
                {lockedShiftCount} {lockedShiftCount === 1 ? "shift" : "shifts"}
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
                Disbursing &lt; 24h
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
                100% on-time
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
                    Link your hospital's official current account to enable automated shift payouts, security deposits, and escrow refunds.
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
                    {currentBank.verifiedAt || "Penny Drop Verified"}
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
                  { id: "invoices", label: "Tax Invoices" },
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
                        title={hasLinkedBank ? "Bank account verified" : "No bank account linked"}
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
                  placeholder={activeTab === "invoices" ? "Filter tax invoices..." : "Filter transactions..."}
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
                                  title="View tax invoice preview"
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

          {/* TAB 2: Clean Dynamic Tax Invoices Table */}
          {activeTab === "invoices" && (
            <div>
              <div className="px-4 py-3 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>GSTIN: <strong className="font-mono text-foreground">29AABCT1332L1Z4</strong> (18% GST with full ITC eligibility)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast.success("Consolidated annual statement sent to billing email.")}
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
                      <th className="py-3 px-4 text-right">Taxable</th>
                      <th className="py-3 px-4 text-right">GST (18%)</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground font-medium">
                          No tax invoices match your filter.
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
                              title="Click to preview official tax invoice"
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
                                title="Download PDF Tax Invoice"
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
                      Link your hospital's official current account to enable automated escrow refunds, standby reimbursements, and bank mandates.
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
                        <span>{currentBank.verifiedAt || "Cashfree Penny Drop Verified"}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                      Primary verified current account for automated escrow refunds, standby reimbursements, and bank mandates.
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
                        <button
                          type="button"
                          onClick={() => setShowFullAcc(!showFullAcc)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                          title={showFullAcc ? "Hide Account" : "Show Account"}
                        >
                          {showFullAcc ? <HiOutlineEyeSlash className="h-3.5 w-3.5" /> : <HiOutlineEye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentBank.accountNumber, "bankacc", "Account number")}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Copy Account Number"
                        >
                          {copiedKey === "bankacc" ? <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-600" /> : <HiOutlineDocumentDuplicate className="h-3.5 w-3.5" />}
                        </button>
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
                    <span>Penny drop status: <strong className="text-emerald-600 dark:text-emerald-400">Match 100%</strong></span>
                    <span className="font-mono text-[10px]">Ref: CF_PD_9918241029</span>
                  </div>
                </div>

                {/* Right (5 cols): Uploaded Cancelled Cheque / Bank Mandate Document */}
                <div className="md:col-span-5 rounded-2xl border border-border/70 bg-card p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        KYC Bank Mandate
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {currentBank.documentDate || "Active"}
                      </span>
                    </div>

                    {/* Document Preview Card */}
                    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <HiOutlineDocumentText className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground truncate block">
                            {currentBank.documentName || "Cancelled_Cheque.pdf"}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            PDF Document · Verified Cheque
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toast.success(`Viewing ${currentBank.documentName || "cheque"}...`)}
                        className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer"
                      >
                        View
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      This verified document is required by RBI Nodal regulations to safeguard escrow disbursements against unauthorized account changes.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBankModalOpen(true)}
                    className="w-full rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer"
                  >
                    <HiOutlineArrowUpTray className="h-3.5 w-3.5" />
                    <span>Upload New Cancelled Cheque</span>
                  </Button>
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
              Funds are ring-fenced for verified shift payouts for {orgName}.
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
                disabled={isProcessing}
                onClick={handleConfirmTopUp}
                className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer bg-primary hover:bg-primary-hover shadow-2xs"
              >
                {isProcessing ? "Processing..." : "Confirm Deposit"}
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
              const isSelected = selectedPkg.id === pkg.id;
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
                disabled={isProcessing}
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
                Hospital Bank Mandate &amp; Cancelled Cheque
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Authorized institutional account for escrow refunds and Cashfree B2B validation.
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

              {/* Cancelled Cheque / Bank Mandate Document Upload */}
              <div className="space-y-2 pt-0.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Upload Cancelled Cheque / Passbook <span className="text-destructive">*</span></span>
                  <span className="text-[10px] text-muted-foreground font-normal">PDF, JPG, PNG (Max 5MB)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formChequeFile ? (
                  <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <HiOutlineDocumentText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate block">
                          {formChequeFile}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                          Ready for Penny Drop Verification
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 text-xs text-primary font-semibold hover:bg-muted cursor-pointer px-2"
                      >
                        Change
                      </Button>
                      <button
                        type="button"
                        onClick={() => setFormChequeFile("")}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 rounded-xl border border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/30 transition-all text-center cursor-pointer space-y-1"
                  >
                    <HiOutlineArrowUpTray className="h-4.5 w-4.5 mx-auto text-primary" />
                    <span className="text-xs font-bold text-foreground block">
                      Click to browse or drop Cancelled Cheque
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Must show Account No, IFSC &amp; Entity Name
                    </span>
                  </div>
                )}
              </div>

              {/* Cashfree Penny Drop Info Alert */}
              <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-foreground text-[11px]">
                  <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                  <span>Cashfree ₹1 Penny Drop Verification</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  A live ₹1 deposit will verify account holder match with <strong>{formHolderName || orgName}</strong>.
                </p>
              </div>
            </div>

            {/* Sticky Modal Actions Bar (Always Visible!) */}
            <div className="p-4 border-t border-border/60 bg-muted/20 shrink-0 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline-block">
                Secure RBI Escrow Mandate
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
                  isLoading={isVerifyingPenny}
                  loadingText="Verifying Penny Drop..."
                  className="rounded-xl text-xs font-semibold h-9 px-4.5 cursor-pointer bg-primary hover:bg-primary-hover shadow-2xs gap-1.5"
                >
                  <HiOutlineCheck className="h-4 w-4" />
                  <span>Verify &amp; Save Bank</span>
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
                  Official Tax Invoice &amp; Settlement Receipt
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono truncate block">
                  Invoice #: {selectedInvoice?.invoiceId}
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
                <span>Download PDF Receipt</span>
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
                      <p className="font-bold text-foreground/90">THE FALE HEALTHCARE PRIVATE LIMITED</p>
                      <p>Healthcare Staffing &amp; 24-Hour Nodal Escrow Platform</p>
                      <p>CIN: U85100KA2025PTC189210 • GSTIN: 29AABCT1332L1Z4</p>
                      <p>Bengaluru, Karnataka - 560001 • billing@thefale.com</p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right space-y-1 shrink-0">
                    <span className="inline-block text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      OFFICIAL TAX INVOICE
                    </span>
                    <div className="font-mono text-xs font-bold text-foreground mt-1">
                      {selectedInvoice.invoiceId}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Date: <span className="font-medium text-foreground">{selectedInvoice.date}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Route: <span className="font-medium text-foreground">ICICI Nodal Escrow</span>
                    </p>
                  </div>
                </div>

                {/* Status banner */}
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <HiOutlineCheckBadge className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block">PAID &amp; SETTLED VIA ESCROW RESERVE</span>
                      <span className="text-[11px] opacity-85">Rule 48 CGST Rules, 2017 • Valid electronic tax invoice</span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] bg-background/90 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-bold">
                    Ref: {selectedInvoice.refNumber}
                  </div>
                </div>

                {/* Two columns: Billed to & Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Billed To (Hospital)</span>
                    <p className="text-sm font-bold text-foreground">{selectedInvoice.hospitalName}</p>
                    <p className="text-[11px] text-muted-foreground">GSTIN: {selectedInvoice.gstin || "29AABCT1332L1Z4"}</p>
                    <p className="text-[11px] text-muted-foreground">{selectedInvoice.facilityAddress}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Settlement Account</span>
                    <p className="text-xs font-mono font-bold text-foreground">
                      {currentBank ? `${currentBank.bankName} (•••• ${currentBank.accountNumber.slice(-4)})` : (selectedInvoice.nodalAccount ? `Virtual A/C: ${selectedInvoice.nodalAccount}` : "Escrow Wallet Linked")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {currentBank ? `IFSC: ${currentBank.ifsc}` : "Automated Escrow Reconciliation"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Period: {selectedInvoice.period}</p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-border/70 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border/60 font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Service Description</th>
                        <th className="py-2.5 px-3">SAC</th>
                        <th className="py-2.5 px-3 text-right">Taxable</th>
                        <th className="py-2.5 px-3 text-right">GST (18%)</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="py-3 px-3">
                          <p className="font-bold text-foreground">{selectedInvoice.description}</p>
                          <p className="text-[10px] text-muted-foreground">{selectedInvoice.subtitle}</p>
                        </td>
                        <td className="py-3 px-3 font-mono text-muted-foreground">998311</td>
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
                    <p className="font-semibold text-foreground">Input Tax Credit (ITC) Eligible</p>
                    <p>This invoice is fully eligible for GST input tax credit under Section 16 of the CGST Act.</p>
                  </div>

                  <div className="w-full sm:w-64 space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60 font-mono text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>₹{selectedInvoice.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST (9%):</span>
                      <span>₹{(selectedInvoice.gst / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST (9%):</span>
                      <span>₹{(selectedInvoice.gst / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-border/70 pt-1.5 flex justify-between font-bold text-sm text-foreground">
                      <span>Total Paid:</span>
                      <span className="text-primary">₹{selectedInvoice.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Legal & Seal */}
                <div className="pt-4 border-t border-border/70 flex items-center justify-between text-[10px] text-muted-foreground">
                  <p>Valid without physical signature under the IT Act, 2000.</p>
                  <span className="font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    FALE ESCROW SECURE
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
