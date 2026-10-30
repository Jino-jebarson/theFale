import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, type LegalSectionItem } from "@/components/fale/LegalLayout";
import { HiOutlineScale, HiOutlineExclamationTriangle, HiOutlineShieldCheck, HiOutlineCurrencyRupee } from "react-icons/hi2";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · The Fale Healthcare" },
      {
        name: "description",
        content:
          "Official Terms of Service for The Fale Healthcare Technologies. Rules governing clinician credential verification, instant locum shifts, 24-hr payouts, and hospital success-based recruitment.",
      },
    ],
  }),
  component: TermsOfServicePage,
});

const sections: LegalSectionItem[] = [
  { id: "nature-of-platform", title: "1. Nature of Platform & Intermediary Capacity" },
  { id: "clinician-warranties", title: "2. Clinician Registration & Licensing Warranties" },
  { id: "locum-shifts", title: "3. Instant Locum Shifts & Attendance Protocols" },
  { id: "payouts-remuneration", title: "4. Locum Remuneration & 24-Hour Payout SLA" },
  { id: "cancellation-standby", title: "5. Cancellation Rules & Standby Protections" },
  { id: "hospital-recruitment", title: "6. Hospital Permanent Recruitment & Success Fees" },
  { id: "clinical-disclaimer", title: "7. Clinical Indemnity & Medical Liability Disclaimer" },
  { id: "clinical-academy", title: "8. The Fale Clinical Academy & Skill Badges" },
  { id: "code-of-conduct", title: "9. Professional Code of Conduct & Patient Privacy" },
  { id: "governing-law-arbitration", title: "10. Governing Law & Arbitration in Bengaluru" },
  { id: "legal-contacts", title: "11. Corporate Notices & Legal Contact" },
];

function TermsOfServicePage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Rules and legal conditions governing healthcare professionals, clinical establishments, locum shifts, and recruitment operations on The Fale platform."
      effectiveDate="November 1, 2026"
      lastUpdated="October 24, 2026"
      activeDoc="terms"
      sections={sections}
    >
      {/* 1. Nature of Platform */}
      <section id="nature-of-platform" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          1. Nature of Platform &amp; Intermediary Capacity
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These Terms of Service (<strong>&quot;Terms&quot;</strong>) constitute a binding legal agreement between you (whether as an individual healthcare professional or authorized hospital representative) and <strong>The Fale Healthcare Technologies Private Limited</strong> (<strong>&quot;The Fale&quot;</strong>, <strong>&quot;Platform&quot;</strong>, <strong>&quot;we&quot;</strong>, or <strong>&quot;us&quot;</strong>), having its registered office in Bengaluru, Karnataka, India.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          By creating an account, authenticating credentials, or utilizing any portion of the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our companion{" "}
          <Link to="/privacy" className="text-primary font-semibold hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <HiOutlineScale className="w-4 h-4 text-primary shrink-0" />
            <span>Intermediary Status Under Section 79 of the IT Act, 2000</span>
          </div>
          <p>
            The Fale operates strictly as an electronic technology platform and intermediary. The Fale provides software infrastructure, automated credential verification pipes (via DigiLocker &amp; State Councils), algorithmic matching, and timesheet settlement services. The Fale is <em>not</em> a hospital, clinic, or medical service provider, and does not itself deliver healthcare services or employ medical practitioners as clinical agents.
          </p>
        </div>
      </section>

      {/* 2. Clinician Warranties */}
      <section id="clinician-warranties" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          2. Clinician Registration &amp; Licensing Warranties
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every healthcare professional registering on The Fale represents, warrants, and covenants that:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li>They possess authentic, active, and unencumbered registrations with the <strong>National Medical Commission (NMC)</strong>, <strong>State Medical Council</strong>, <strong>Indian Nursing Council (INC)</strong>, <strong>State Nursing Council</strong>, <strong>Pharmacy Council of India (PCI)</strong>, or councils governed by the <strong>National Commission for Allied and Healthcare Professions Act, 2021</strong>.</li>
          <li>All educational degrees, certificates, and DigiLocker identity records submitted are genuine and free from fraudulent alterations.</li>
          <li>They are not subject to any pending disciplinary proceedings, council reprimands, or court judgments barring them from practicing their clinical profession.</li>
        </ul>
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-muted-foreground leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-destructive">
            <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
            <span>Zero Tolerance for Fraudulent Credentials</span>
          </div>
          <p>
            Submitting forged medical licenses, impersonated DigiLocker documents, or expired registrations will result in immediate permanent expulsion, forfeiture of pending shift remuneration, and mandatory formal reporting to the appropriate State Medical or Nursing Council and law enforcement authorities under the Indian Penal Code / Bharatiya Nyaya Sanhita.
          </p>
        </div>
      </section>

      {/* 3. Instant Locum Shifts */}
      <section id="locum-shifts" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          3. Instant Locum Shifts &amp; Attendance Protocols
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Fale Instant Locum Engine facilitates short-term clinical staffing between hospitals and verified practitioners:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li><strong>Binding Shift Acceptance:</strong> Accepting an instant locum shift constitutes an enforceable commitment. Clinicians must report to the healthcare facility at least 15 minutes prior to shift commencement for clinical handover.</li>
          <li><strong>Geofenced GPS Check-In:</strong> Active shift hours are verified using The Fale mobile app within the hospital&apos;s registered geographic boundary.</li>
          <li><strong>Supervisor Sign-Off:</strong> Timesheets must be digitally counter-signed by the hospital&apos;s authorized duty doctor, nursing superintendent, or HR manager upon shift completion.</li>
        </ul>
      </section>

      {/* 4. Locum Remuneration & Payout SLA */}
      <section id="payouts-remuneration" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          4. Locum Remuneration &amp; 24-Hour Payout SLA
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We guarantee prompt, transparent compensation for verified locum shifts:
        </p>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-muted-foreground leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <HiOutlineCurrencyRupee className="w-4 h-4 shrink-0" />
            <span>24-Hour Remittance Commitment</span>
          </div>
          <p>
            Once the hospital digitally validates the shift timesheet, The Fale initiates an automated bank transfer (via NEFT, IMPS, or UPI) to the clinician&apos;s verified bank account within <strong>24 business hours</strong>.
          </p>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Applicable Tax Deducted at Source (TDS) under Section 194J of the Income Tax Act is withheld, and downloadable Form 16A certificates are made available quarterly in the clinician&apos;s profile.
        </p>
      </section>

      {/* 5. Cancellation & Standby Protections */}
      <section id="cancellation-standby" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          5. Cancellation Rules &amp; Standby Protections
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To maintain fairness for both clinicians and hospital emergency departments, the following cancellation provisions apply:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
          <li><strong>Clinician Notice &gt; 24 Hours:</strong> No penalty. The shift is immediately re-opened to other verified professionals in the locality.</li>
          <li><strong>Clinician Late Cancellation (&lt; 6 Hours) or Unexcused No-Show:</strong> Incurs a temporary suspension on instant shift bookings pending review and a reliability score deduction. Repeated unexcused absences result in platform debarment.</li>
          <li><strong>Hospital Late Cancellation (&lt; 6 Hours Before Shift):</strong> The hospital is assessed a <strong>50% standby compensation fee</strong>, credited directly to the clinician for lost shift availability.</li>
        </ul>
      </section>

      {/* 6. Hospital Permanent Recruitment */}
      <section id="hospital-recruitment" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          6. Hospital Permanent Recruitment &amp; Success Fees
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For full-time and permanent clinical placements, The Fale operates under a success-based model:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li><strong>Pay Only When You Hire:</strong> Hospitals may post vacancies, review verified candidate credentials, and conduct interviews free of upfront retainers. A placement fee is earned strictly upon successful candidate joining.</li>
          <li><strong>90-Day Replacement Guarantee:</strong> If a hired healthcare professional resigns or is terminated for cause within 90 calendar days of joining, The Fale provides a priority replacement shortlist or recruitment credit at no additional charge.</li>
          <li><strong>12-Month Non-Circumvention:</strong> Healthcare facilities interviewing candidates introduced via The Fale agree not to hire or engage that candidate directly off-platform for a period of 12 months following introduction without settling the agreed placement fee.</li>
        </ul>
      </section>

      {/* 7. Clinical Indemnity & Medical Liability Disclaimer */}
      <section id="clinical-disclaimer" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          7. Clinical Indemnity &amp; Medical Liability Disclaimer
        </h2>
        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-muted-foreground leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-destructive uppercase tracking-wider">
            <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
            <span>Important Medical Disclaimer</span>
          </div>
          <p>
            <strong>The Fale does not practice medicine and is not responsible for patient clinical care.</strong> Attending healthcare professionals deliver clinical care as independent practitioners exercising their professional clinical judgment.
          </p>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li>The host healthcare facility maintains supervisory clinical governance under the <strong>Clinical Establishments (Registration and Regulation) Act</strong> and ensures adequate biomedical equipment, infection control, and pharmaceutical supply.</li>
          <li>Clinicians are strongly advised to maintain active Professional Indemnity Insurance appropriate for their medical specialization.</li>
          <li>The Fale carries no liability for clinical misdiagnosis, procedural complications, or medical negligence occurring at partner facilities.</li>
        </ul>
      </section>

      {/* 8. The Fale Clinical Academy */}
      <section id="clinical-academy" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          8. The Fale Clinical Academy &amp; Skill Badges
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Fale Clinical Academy provides continuing medical education, clinical simulations, and credential badges. Participation is subject to the following:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li>Skill badges confirm completion of specific platform assessments but do not replace or substitute for statutory licenses granted by National or State Medical Councils.</li>
          <li>Course curriculum, video simulations, and assessment content are proprietary intellectual property of The Fale Healthcare Technologies Pvt. Ltd. and may not be reproduced without written authorization.</li>
        </ul>
      </section>

      {/* 9. Professional Code of Conduct */}
      <section id="code-of-conduct" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          9. Professional Code of Conduct &amp; Patient Privacy
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          All platform participants must uphold the highest standards of professional and medical ethics:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li><strong>Patient Confidentiality:</strong> Users must never photograph, record, or disclose patient identifiable health information (PHI) accessed during assignments.</li>
          <li><strong>Substance Prohibition:</strong> Zero tolerance for reporting to clinical duties under the influence of alcohol or non-prescribed pharmaceuticals. Immediate disqualification applies.</li>
          <li><strong>Equitable Care:</strong> Clinicians must deliver compassionate, unbiased medical care to all patients regardless of religion, caste, gender, or background.</li>
        </ul>
      </section>

      {/* 10. Governing Law & Arbitration */}
      <section id="governing-law-arbitration" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          10. Governing Law &amp; Arbitration in Bengaluru
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These Terms and any dispute arising hereunder shall be governed by and construed in accordance with the <strong>laws of the Republic of India</strong>.
        </p>
        <div className="p-4 rounded-xl border border-border bg-card text-xs sm:text-sm space-y-2">
          <p className="font-semibold text-foreground">Dispute Resolution Process:</p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
            <li><strong>Negotiation:</strong> Parties shall first attempt in good faith to resolve disputes amicably through formal written notice to <a href="mailto:legal@thefale.com" className="text-primary hover:underline">legal@thefale.com</a> within thirty (30) business days.</li>
            <li><strong>Binding Arbitration:</strong> Unresolved disputes shall be referred to and finally resolved by arbitration conducted by a sole arbitrator mutually agreed upon, in accordance with the <strong>Arbitration and Conciliation Act, 1996</strong>. The seat and venue of arbitration shall be <strong>Bengaluru, Karnataka, India</strong>, and proceedings shall be in English.</li>
            <li><strong>Court Jurisdiction:</strong> Subject to arbitration, the courts of competent jurisdiction in <strong>Bengaluru, Karnataka</strong> shall have exclusive jurisdiction.</li>
          </ol>
        </div>
      </section>

      {/* 11. Corporate Contact */}
      <section id="legal-contacts" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          11. Corporate Notices &amp; Legal Contact
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Formal legal notices, contractual questions, and corporate communications may be served to:
        </p>
        <div className="p-4 rounded-xl border border-border bg-card text-xs sm:text-sm space-y-1.5 text-muted-foreground">
          <p className="font-semibold text-foreground">Legal &amp; Compliance Desk</p>
          <p>The Fale Healthcare Technologies Private Limited</p>
          <p>100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India</p>
          <p>
            Email:{" "}
            <a href="mailto:legal@thefale.com" className="text-primary font-medium hover:underline">
              legal@thefale.com
            </a>
          </p>
          <p>Telephone: +91 73383 67726 (Monday through Friday, 9:30 AM – 6:00 PM IST)</p>
        </div>
      </section>
    </LegalLayout>
  );
}
