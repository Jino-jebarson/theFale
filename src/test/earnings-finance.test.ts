import { describe, expect, it } from "vitest";
import { earningState, toEarning, earningsTotals } from "@/lib/earningsModel";
import { amountInWords, buildPayoutAdviceDoc } from "@/lib/payoutSlipPdf";
import { walletDocumentTitle, includeStatement } from "@/lib/walletDocuments";
import type { ShiftClaimDto } from "@/lib/adapters/shiftAdapter";
const claim = (status: string, payoutStatus = "NONE") => ({ id: "claim", status, payoutStatus, grossAmountPaise: 100001, platformFeePaise: 0, tdsAmountPaise: 10000, netAmountPaise: 90001 } as ShiftClaimDto);
describe("earnings and payment documents", () => {
  it.each(["CLAIMED","APPLIED","REJECTED","NO_SHOW","CANCELLED","WITHDRAWN","SLOT_FILLED"])("never counts %s as pending earnings", status => {
    const row=toEarning(claim(status)); expect(row.net).toBe(0); expect(earningsTotals([row])).toEqual({paid:0,reserved:0,pending:0,frozen:0}); expect(row.adviceAvailable).toBe(false);
  });
  it("keeps approved payouts separate from bank disbursements and preserves paise", () => {
    const rows=[toEarning(claim("CONFIRMED")),toEarning(claim("COMPLETED","PENDING_DISBURSEMENT")),toEarning(claim("COMPLETED","DISBURSED"))];
    expect(earningsTotals(rows)).toEqual({paid:900.01,reserved:900.01,pending:900.01,frozen:0});
    expect(earningState(claim("DISPUTED","DISBURSED"))).toBe("paid");
    expect(toEarning({...claim("COMPLETED","DISBURSED"),netAmountPaise:0}).net).toBe(0);
  });
  it("does not invent missing historical amounts", () => {
    const row=toEarning({...claim("COMPLETED","DISBURSED"),tdsAmountPaise:undefined}); expect(row.amountsRecorded).toBe(false); expect(earningsTotals([row]).paid).toBe(0);
  });
  it("uses actual deductions and paise in payout PDFs", () => {
    const record={id:"claim",shiftTitle:"Duty",hospitalName:"Hospital",dept:"ICU",shiftDate:"12 Nov",hours:7,rate:0,amount:900.01,payoutDate:"13 Nov",status:"Disbursed",payoutMethodUsed:"Saved bank ****0001",grossAmount:1000.01,platformFee:0,tdsAmount:100,utr:"BANK12345678"};
    const pdf=buildPayoutAdviceDoc(record,"Clinician").output();
    expect(pdf).toContain("100.00"); expect(pdf).toContain("900.01"); expect(pdf).toContain("BANK12345678"); expect(pdf).not.toContain("TRACES");
    expect(()=>buildPayoutAdviceDoc({...record,tdsAmount:0},"Clinician")).toThrow(/reconcile/);
    expect(()=>buildPayoutAdviceDoc({...record,tdsAmount:undefined},"Clinician")).toThrow(/unavailable/);
    expect(amountInWords(900.01)).toContain("One Paise");
  });
  it("does not describe pending deposits as credited and hides historical duplicate queues", () => {
    expect(walletDocumentTitle("topup","Pending Reconciliation")).toMatch(/awaiting reconciliation/);
    expect(walletDocumentTitle("disbursement","Processing")).toMatch(/Pending/);
    expect(includeStatement({status:"Processing"})).toBe(false); expect(includeStatement({status:"Processing",canonicalDocument:true})).toBe(true);
  });
});
