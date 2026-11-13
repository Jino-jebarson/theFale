import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { RequestError } from "@/components/fale/RequestError";
import { usePageLoad } from "@/hooks/use-page-load";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineBuildingLibrary,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineDocumentCheck,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { money } from "@/lib/earningsModel";
type Deposit = {
  id: string;
  facilityName: string;
  amountPaise: number;
  utr: string;
  createdAt: string;
};
type Account = {
  id: string;
  kind: "candidate" | "hospital";
  name: string;
  holder: string;
  destination: string;
  updatedAt: string;
};
export function FinanceReviewPanel() {
  const page = usePageLoad(),
    action = useConfirmedAction();
  const [deposits, setDeposits] = useState<Deposit[]>([]),
    [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<{ deposit: Deposit } | { account: Account } | null>(
    null,
  );
  const [reference, setReference] = useState(""),
    [notes, setNotes] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      apiFetch<Deposit[]>("/admin/finance/deposits", { cache: "no-store" }),
      apiFetch<Account[]>("/admin/finance/accounts", { cache: "no-store" }),
    ])
      .then(([funding, ownership]) => {
        if (alive) {
          setDeposits(funding);
          setAccounts(ownership);
        }
      })
      .catch((cause) => {
        if (alive) page.fail(cause);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [version, page.retryKey]);
  const open = (item: NonNullable<typeof selected>) => {
    setSelected(item);
    setReference("");
    setNotes("");
    setConfirmed(false);
  };
  const review = async (approved: boolean) =>
    action.run(async () => {
      if (!selected) return;
      if (notes.trim().length < 10 || (approved && !confirmed)) return;
      if ("deposit" in selected) {
        if (!/^[A-Za-z0-9]{8,30}$/.test(reference.trim())) return;
        await apiFetch(`/admin/finance/deposits/${selected.deposit.id}/review`, {
          method: "POST",
          body: JSON.stringify({ approved, bankReference: reference.trim(), notes: notes.trim() }),
        });
      } else
        await apiFetch(
          `/admin/finance/accounts/${selected.account.kind}/${selected.account.id}/review`,
          {
            method: "POST",
            body: JSON.stringify({
              approved,
              expectedUpdatedAt: selected.account.updatedAt,
              notes: notes.trim(),
            }),
          },
        );
      setSelected(null);
      setVersion((value) => value + 1);
    });
  const reviewCount = deposits.length + accounts.length;
  const invalidReference =
    !!selected && "deposit" in selected && !/^[A-Za-z0-9]{8,30}$/.test(reference.trim());
  const cannotSubmit = action.isPending || notes.trim().length < 10 || invalidReference;
  const fieldClass =
    "rounded-xl border-border/80 bg-background text-xs shadow-none focus-visible:ring-primary/20 focus-visible:border-primary";
  return (
    <div className="p-4 sm:p-5 space-y-5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-start gap-3 min-w-0">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
            <HiOutlineShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-foreground">
              Finance reconciliation
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
              Review hospital deposits and payout account ownership. Check the supporting bank
              evidence before approving.
            </p>
          </div>
        </div>
        {!page.error && (
          <span className="self-start inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-[10px] font-bold text-primary shrink-0">
            <HiOutlineClock className="h-3.5 w-3.5" />
            {loading
              ? "Loading reviews"
              : reviewCount + " pending " + (reviewCount === 1 ? "review" : "reviews")}
          </span>
        )}
      </div>
      <RequestError message={page.error} onRetry={page.retry} />
      <RequestError message={selected ? null : action.error} />
      <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary-soft/30 px-3.5 py-3 text-[11px] text-muted-foreground leading-relaxed">
        <HiOutlineDocumentCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          Approval records your manual review. It does not initiate a bank transfer. Deposits become
          available only after you confirm receipt.
        </p>
      </div>
      {loading && (
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-muted/20 py-10 text-xs text-muted-foreground"
        >
          <ButtonSpinner className="text-primary" />
          Loading finance queues...
        </div>
      )}

      <section
        aria-labelledby="finance-deposits-heading"
        className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
              <HiOutlineBanknotes className="h-4 w-4" />
            </span>
            <div>
              <h3
                id="finance-deposits-heading"
                className="text-xs sm:text-sm font-bold text-foreground"
              >
                Deposits awaiting reconciliation
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Confirm the received amount and bank reference.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-primary-soft border border-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary">
            {loading || page.error ? "--" : deposits.length}
          </span>
        </div>
        {!loading && !page.error && !deposits.length && (
          <div className="px-4 py-9 text-center">
            <HiOutlineBanknotes className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2.5 text-xs font-semibold text-foreground">
              No deposits awaiting review
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              New hospital deposit requests will appear here.
            </p>
          </div>
        )}
        <div className="divide-y divide-border/60">
          {deposits.map((row) => (
            <article
              key={row.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                  <HiOutlineBuildingLibrary className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-sm text-foreground break-words">
                      {row.facilityName}
                    </p>
                    <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                      Awaiting reconciliation
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Submitted UTR:{" "}
                    <span className="font-mono text-foreground break-all">{row.utr}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Balance is unchanged until approval.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60 shrink-0">
                <div className="sm:text-right">
                  <p className="text-[10px] text-muted-foreground">Deposit amount</p>
                  <p className="text-base font-extrabold text-primary font-mono">
                    {money(row.amountPaise / 100)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-9 rounded-xl px-4 text-xs font-bold gap-1.5"
                  onClick={() => open({ deposit: row })}
                >
                  Review deposit
                  <HiOutlineArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="finance-ownership-heading"
        className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
              <HiOutlineShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h3
                id="finance-ownership-heading"
                className="text-xs sm:text-sm font-bold text-foreground"
              >
                Bank / UPI ownership reviews
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Verify the account holder and payout destination.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-primary-soft border border-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary">
            {loading || page.error ? "--" : accounts.length}
          </span>
        </div>
        {!loading && !page.error && !accounts.length && (
          <div className="px-4 py-9 text-center">
            <HiOutlineShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2.5 text-xs font-semibold text-foreground">
              No account reviews pending
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              New or updated payout details will appear here.
            </p>
          </div>
        )}
        <div className="divide-y divide-border/60">
          {accounts.map((row) => (
            <article
              key={row.kind + row.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary shrink-0">
                  {row.kind === "hospital" ? (
                    <HiOutlineBuildingLibrary className="h-5 w-5" />
                  ) : (
                    <HiOutlineUserCircle className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-sm text-foreground break-words">{row.name}</p>
                    <span className="rounded-full border border-primary/15 bg-primary-soft px-2 py-0.5 text-[9px] font-bold text-primary">
                      {row.kind === "hospital" ? "Hospital" : "Candidate"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Account holder:{" "}
                    <span className="font-medium text-foreground">{row.holder}</span>
                  </p>
                  <p className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1 text-[11px] font-mono text-muted-foreground max-w-full">
                    <HiOutlineBuildingLibrary className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-all">{row.destination}</span>
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-xl px-4 text-xs font-bold gap-1.5 self-end sm:self-auto shrink-0"
                onClick={() => open({ account: row })}
              >
                Review ownership
                <HiOutlineArrowRight className="h-3.5 w-3.5" />
              </Button>
            </article>
          ))}
        </div>
      </section>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !action.isPending) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-lg p-0 max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border-border/80 bg-background shadow-2xl">
          <DialogHeader className="px-5 py-4 pr-12 border-b border-border/60 bg-muted/20 shrink-0 text-left">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                <HiOutlineShieldCheck className="h-4.5 w-4.5" />
              </span>
              <DialogTitle className="text-sm font-extrabold text-foreground">
                {selected && "deposit" in selected
                  ? "Reconcile deposit"
                  : "Review account ownership"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              Check the supporting bank evidence, then record your decision and review notes.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto p-5 space-y-4 min-h-0">
            <RequestError message={action.error} />
            {selected && (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2 text-xs">
                <p className="font-bold text-foreground">
                  {"deposit" in selected ? selected.deposit.facilityName : selected.account.name}
                </p>
                {"deposit" in selected ? (
                  <>
                    <p className="flex justify-between gap-3 text-muted-foreground">
                      Deposit amount
                      <span className="font-bold text-primary">
                        {money(selected.deposit.amountPaise / 100)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Submitted UTR:{" "}
                      <span className="font-mono text-foreground break-all">
                        {selected.deposit.utr}
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Account holder:{" "}
                      <span className="font-semibold text-foreground">
                        {selected.account.holder}
                      </span>
                    </p>
                    <p className="font-mono text-muted-foreground break-all">
                      {selected.account.destination}
                    </p>
                  </>
                )}
              </div>
            )}
            {selected && "deposit" in selected && (
              <div className="space-y-1.5">
                <label
                  htmlFor="finance-bank-reference"
                  className="text-xs font-bold text-foreground"
                >
                  Actual bank reference <span className="text-destructive">*</span>
                </label>
                <Input
                  id="finance-bank-reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  maxLength={30}
                  autoComplete="off"
                  disabled={action.isPending}
                  placeholder="Enter the reference from the bank receipt"
                  className={fieldClass + " font-mono h-10"}
                />
                <p className="text-[10px] text-muted-foreground">
                  Use 8-30 letters or digits matching the submitted UTR.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="finance-review-notes" className="text-xs font-bold text-foreground">
                Evidence and review notes <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="finance-review-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
                rows={4}
                disabled={action.isPending}
                placeholder="Describe the bank evidence checked and the reason for your decision..."
                className={fieldClass + " min-h-24 resize-y"}
              />
              <p className="text-[10px] text-muted-foreground">
                At least 10 characters. Your review is saved for audit.
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary-soft/30 p-3">
              <Checkbox
                id="finance-evidence-confirmed"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
                disabled={action.isPending}
                className="mt-0.5 rounded"
              />
              <label
                htmlFor="finance-evidence-confirmed"
                className="text-[11px] text-muted-foreground leading-relaxed cursor-pointer"
              >
                I checked the bank receipt or ownership evidence and confirm this request is
                correct.
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 p-4 border-t border-border/60 bg-muted/20 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              disabled={action.isPending}
              onClick={() => setSelected(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 px-3.5 text-xs font-bold"
                disabled={cannotSubmit}
                onClick={() => void review(false)}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-xl px-4 text-xs font-bold gap-1.5"
                isLoading={action.isPending}
                loadingText="Saving review..."
                disabled={cannotSubmit || !confirmed}
                onClick={() => void review(true)}
              >
                <HiOutlineCheck className="h-3.5 w-3.5" />
                Approve review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
