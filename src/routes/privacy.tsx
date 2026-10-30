import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, type LegalSectionItem } from "@/components/fale/LegalLayout";
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineExclamationTriangle } from "react-icons/hi2";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · The Fale Healthcare" },
      {
        name: "description",
        content:
          "Official Privacy Policy of The Fale Healthcare Technologies. How we safeguard clinician council credentials, DigiLocker data, and hospital recruiting records under India's Digital Personal Data Protection Act, 2023.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

const sections: LegalSectionItem[] = [
  { id: "introduction", title: "1. Introduction & Statutory Framework" },
  { id: "data-collected", title: "2. Information We Collect" },
  { id: "digilocker-zero-storage", title: "3. DigiLocker & Identity Verification" },
  { id: "purpose-of-processing", title: "4. Purpose & Grounds for Processing" },
  { id: "disclosure-sharing", title: "5. Information Sharing & Third Parties" },
  { id: "data-security-storage", title: "6. Data Security & Storage in India" },
  { id: "data-principal-rights", title: "7. Your Rights Under DPDP Act 2023" },
  { id: "retention-erasure", title: "8. Data Retention & Account Deletion" },
  { id: "grievance-officer", title: "9. Grievance Redressal & DPO Contact" },
];

function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How The Fale safeguards clinical identities, statutory council registrations, and hospital staffing data in strict accordance with Indian digital privacy laws."
      effectiveDate="November 1, 2026"
      lastUpdated="October 24, 2026"
      activeDoc="privacy"
      sections={sections}
    >
      {/* 1. Introduction & Statutory Framework */}
      <section id="introduction" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          1. Introduction &amp; Statutory Framework
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong>The Fale Healthcare Technologies Private Limited</strong> (&quot;The Fale&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides a verified healthcare workforce network connecting licensed clinical professionals (doctors, registered nurses, pharmacists, and allied health clinicians) with accredited healthcare institutions across India.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This Privacy Policy outlines our transparent data practices concerning the collection, verification, use, and disclosure of personal data when you use The Fale web application, mobile interface, APIs, or credential verification services.
        </p>
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <HiOutlineShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Statutory Compliance Architecture</span>
          </div>
          <p>
            This Privacy Policy is formulated and enforced under the <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>, the <strong>Information Technology Act, 2000</strong>, the IT (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and relevant standards framed by the <strong>National Health Authority (NHA)</strong> under the Ayushman Bharat Digital Mission (ABDM).
          </p>
        </div>
      </section>

      {/* 2. Information We Collect */}
      <section id="data-collected" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          2. Information We Collect
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We only collect data necessary to authenticate clinical licenses, facilitate permanent recruitment, and coordinate instant locum shift assignments:
        </p>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-1">2.1 Clinical Professionals</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li><strong>Contact &amp; Identity:</strong> Legal name, email address, telephone number, and profile photograph.</li>
              <li><strong>Statutory Council Registrations:</strong> Registration numbers and certificate copies with the National Medical Commission (NMC), State Medical Councils, Indian Nursing Council (INC), Pharmacy Council of India (PCI), or the National Commission for Allied and Healthcare Professions (NCAHP).</li>
              <li><strong>Academic Qualifications:</strong> Medical degrees (MBBS, MD/MS, DNB, B.Sc Nursing, GNM, B.Pharm, etc.) and specialty certifications (BLS, ACLS, ATLS).</li>
              <li><strong>Work &amp; Timesheet Records:</strong> Clinical experience history, hospital department rotations, geofenced GPS check-in/out logs for locum shifts, and supervisor counter-signatures.</li>
              <li><strong>Remuneration Data:</strong> Bank account number, IFSC code, or UPI ID strictly for processing 24-hour shift payouts, along with PAN for mandatory Tax Deducted at Source (TDS) under Section 194J/194C of the Income Tax Act.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">2.2 Healthcare Facilities &amp; Institutional Employers</h3>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li><strong>Institutional Details:</strong> Hospital name, Clinical Establishments Act registration certificate, GSTIN, and NABH/NABL accreditation documentation.</li>
              <li><strong>Authorized Personnel:</strong> Names, official hospital email addresses, contact numbers, and designations of Medical Superintendents, HR Directors, and Nursing In-Charges.</li>
              <li><strong>Staffing Requisitions:</strong> Departmental vacancy details, required clinical specializations, hourly locum compensation budgets, and duty roster requirements.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. DigiLocker & Identity Verification */}
      <section id="digilocker-zero-storage" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          3. DigiLocker &amp; Identity Verification
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To eradicate fraudulent credentials and uphold clinical trust, The Fale integrates with Government of India DigiLocker APIs under consent-driven token exchange:
        </p>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-muted-foreground leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
            <HiOutlineShieldCheck className="w-4 h-4 shrink-0" />
            <span>Strict Zero Storage of Raw Aadhaar &amp; Biometrics</span>
          </div>
          <p>
            The Fale acts strictly as a verification requester. <strong>We do not store your 12-digit Aadhaar number, biometric records, or core identity database records.</strong> DigiLocker authentication exchanges one-time cryptographic tokens to verify government-issued medical council certificates and degrees.
          </p>
        </div>
      </section>

      {/* 4. Purpose & Grounds for Processing */}
      <section id="purpose-of-processing" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          4. Purpose &amp; Grounds for Processing
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Under Section 4 and Section 6 of the DPDP Act 2023, The Fale processes your personal data solely on lawful grounds of explicit consent and contractual performance:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li><strong>Licensure Authentication:</strong> Verifying credentials directly with statutory councils and medical universities prior to enabling job applications or shift booking.</li>
          <li><strong>Clinical Matchmaking:</strong> Pairing verified doctors and nurses with hospital departmental vacancies based on verified competencies and locality preferences.</li>
          <li><strong>Locum Operations &amp; Fast Payouts:</strong> Validating geofenced shift attendance and remitting compensation to clinician accounts within our guaranteed 24-hour turnaround window.</li>
          <li><strong>Statutory Tax &amp; Audit Compliance:</strong> Fulfilling mandatory reporting under Indian Income Tax regulations (TDS deduction and Form 16A generation) and the Clinical Establishments Act.</li>
        </ul>
      </section>

      {/* 5. Disclosure & Information Sharing */}
      <section id="disclosure-sharing" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          5. Information Sharing &amp; Third Parties
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong>The Fale never sells, rents, or commercializes personal or clinical data to advertisers, data brokers, or third parties.</strong> Data is shared strictly under the following defined circumstances:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-muted-foreground">
          <li><strong>Authorized Healthcare Institutions:</strong> When a clinician applies for a permanent position or accepts an instant locum shift, their verified professional summary, council registration number, and qualification certificates are disclosed to the hiring hospital's authorized HR and Medical Superintendent.</li>
          <li><strong>Banking &amp; Escrow Infrastructure:</strong> Remittance details are transmitted via encrypted banking rails (RBI-regulated payment aggregators and scheduled commercial banks) strictly to execute shift payouts.</li>
          <li><strong>Statutory &amp; Law Enforcement Mandates:</strong> Where compelled by valid court orders, statutory tribunals, or official investigative inquiries under Indian law.</li>
        </ul>
      </section>

      {/* 6. Data Security & Storage */}
      <section id="data-security-storage" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          6. Data Security &amp; Storage in India
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We maintain defense-in-depth technical and organizational controls to protect personal and clinical data:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-border/70 bg-card">
            <strong className="text-foreground block mb-1">Domestic Data Residency</strong>
            <span className="text-muted-foreground">
              All production databases, audit logs, and credential vaults reside exclusively in ISO 27001 / SOC 2 certified data centers located in Mumbai and Hyderabad, India.
            </span>
          </div>
          <div className="p-3.5 rounded-xl border border-border/70 bg-card">
            <strong className="text-foreground block mb-1">End-to-End Encryption</strong>
            <span className="text-muted-foreground">
              All network data in transit is protected via TLS 1.3 encryption. At rest, databases, council records, and financial tokens are encrypted using AES-256.
            </span>
          </div>
        </div>
      </section>

      {/* 7. Data Principal Rights */}
      <section id="data-principal-rights" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          7. Your Rights Under DPDP Act 2023
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          As a Data Principal under Indian law, you possess enforceable rights regarding your personal information:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li><strong>Right to Access:</strong> Request a complete summary of personal data processed by The Fale and identities of hospitals with whom your credentials have been shared.</li>
          <li><strong>Right to Correction &amp; Updation:</strong> Rectify inaccurate personal data, update newly acquired medical council credentials, or renew registration certificates.</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your account and personal records, subject to statutory retention obligations under tax and medical regulations.</li>
          <li><strong>Right to Withdraw Consent:</strong> Revoke consent for non-essential processing at any time via your account settings.</li>
          <li><strong>Right of Grievance Redressal:</strong> Direct statutory privacy complaints to our designated Data Protection Officer.</li>
        </ul>
      </section>

      {/* 8. Retention & Erasure */}
      <section id="retention-erasure" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          8. Data Retention &amp; Account Deletion
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We retain personal data only for as long as necessary to fulfill the operational purposes set forth herein. Upon formal account closure:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-muted-foreground">
          <li>Clinical profiles and unassigned recruitment applications are permanently purged within 30 calendar days.</li>
          <li>Timesheet logs, locum shift settlements, and TDS withholding statements are maintained for 7 financial years to comply with Indian tax and financial auditing statutes.</li>
        </ul>
      </section>

      {/* 9. Grievance Officer & Contact */}
      <section id="grievance-officer" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground border-b border-border/60 pb-3">
          9. Grievance Redressal &amp; DPO Contact
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          In compliance with the DPDP Act 2023 and the Information Technology Rules, 2011, our designated Grievance Officer &amp; Data Protection Officer (DPO) may be contacted at:
        </p>

        <div className="p-4 rounded-xl border border-border bg-card text-xs sm:text-sm space-y-2">
          <p className="font-semibold text-foreground">Data Protection Officer &amp; Legal Grievance Desk</p>
          <p className="text-muted-foreground">The Fale Healthcare Technologies Private Limited</p>
          <p className="text-muted-foreground">100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India</p>
          <p className="text-muted-foreground">
            Email:{" "}
            <a href="mailto:privacy@thefale.com" className="text-primary font-medium hover:underline">
              privacy@thefale.com
            </a>
          </p>
          <p className="text-muted-foreground">Telephone: +91 73383 67726 (Monday through Friday, 9:30 AM – 6:00 PM IST)</p>
          <p className="text-xs text-muted-foreground/80 pt-2 border-t border-border/60">
            <strong>SLA Commitment:</strong> All privacy grievances will be acknowledged within 24 hours and resolved within 15 business days in accordance with statutory guidelines.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
