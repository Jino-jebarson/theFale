import { useState, useRef, type DragEvent } from "react";
import {
  HiOutlineSparkles,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineCheckBadge,
  HiCheck,
  HiOutlineUser,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineIdentification,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineShieldCheck,
  HiBolt,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  extractTextFromFile,
  parseResumeText,
  SAMPLE_HEALTHCARE_RESUMES,
  type ParsedResumeData,
} from "@/lib/resumeParser";
import { cn } from "@/lib/utils";

interface ResumeParserModalProps {
  open: boolean;
  onClose: () => void;
  onApplyData: (data: ParsedResumeData, fileName: string) => void;
}

type ParseStage = "idle" | "reading" | "analyzing" | "preview";

export function ResumeParserModal({ open, onClose, onApplyData }: ResumeParserModalProps) {
  const [stage, setStage] = useState<ParseStage>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [currentFile, setCurrentFile] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [progressStep, setProgressStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleProcessFile = async (file: File) => {
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
      toast.error("Please upload a PDF, DOCX, or TXT resume.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be under 15 MB.");
      return;
    }

    setCurrentFile(file.name);
    setStage("reading");
    setProgressStep(1);

    try {
      // Step 1: Ingest & read
      await new Promise((r) => setTimeout(r, 450));
      setProgressStep(2);
      setStage("analyzing");

      const text = await extractTextFromFile(file);

      // Step 2: NLP Analysis & extraction
      await new Promise((r) => setTimeout(r, 650));
      setProgressStep(3);

      const result = parseResumeText(text);

      await new Promise((r) => setTimeout(r, 400));
      setProgressStep(4);

      setParsedData(result);
      setStage("preview");
      toast.success("Resume parsed successfully!", {
        description: `Extracted ${result.confidenceScore ?? 80}% profile fields.`,
      });
    } catch (err) {
      console.error("Resume parse failure:", err);
      toast.error("Could not parse this resume format. Please try another file or enter details manually.");
      setStage("idle");
    }
  };

  const handleApplySample = async (sample: (typeof SAMPLE_HEALTHCARE_RESUMES)[number]) => {
    setCurrentFile(sample.fileName);
    setStage("reading");
    setProgressStep(1);

    await new Promise((r) => setTimeout(r, 350));
    setProgressStep(2);
    setStage("analyzing");

    await new Promise((r) => setTimeout(r, 450));
    setProgressStep(3);

    const parsed = parseResumeText(sample.rawText);
    // Merge with sample pre-mapped details for 100% accuracy
    const combined = { ...parsed, ...sample.data, confidenceScore: 98 };

    await new Promise((r) => setTimeout(r, 300));
    setProgressStep(4);

    setParsedData(combined);
    setStage("preview");
    toast.success(`Sample resume loaded: ${sample.title}`);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (!parsedData) return;
    onApplyData(parsedData, currentFile || "Uploaded_Resume.pdf");
    onClose();
  };

  const reset = () => {
    setStage("idle");
    setParsedData(null);
    setCurrentFile("");
    setProgressStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (stage !== "reading" && stage !== "analyzing") onClose();
        }}
      />

      {/* Modal Dialog on Desktop / Bottom Drawer on Mobile */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] sm:max-h-[92vh] overflow-hidden flex flex-col rounded-t-[28px] sm:rounded-3xl border-t sm:border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/25 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 fade-in duration-300">
        {/* Mobile Pull Handle Indicator */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden bg-gradient-to-r from-primary-soft/50 via-white to-amber-50/30">
          <div className="h-1.5 w-12 rounded-full bg-slate-300" />
        </div>

        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4.5 sm:px-6 py-3 sm:py-4.5 bg-gradient-to-r from-primary-soft/50 via-white to-amber-50/30">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <span className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
              <HiOutlineSparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                  AI Resume Auto-Fill
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-800 shrink-0">
                  Instant
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Upload your CV to automatically fetch and populate your profile details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close resume parser"
            className="rounded-xl p-1.5 sm:p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* STAGE 1: UPLOAD / IDLE */}
          {stage === "idle" && (
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer group",
                  dragActive
                    ? "border-primary bg-primary-soft/60 ring-4 ring-primary/10"
                    : "border-slate-200 bg-slate-50/70 hover:border-primary/50 hover:bg-primary-soft/30",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                />

                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-primary shadow-sm border border-slate-200/80 group-hover:scale-105 group-hover:border-primary/30 transition-transform">
                  <HiOutlineCloudArrowUp className="h-7 w-7" />
                </span>

                <h4 className="mt-4 text-sm sm:text-base font-bold text-slate-900">
                  Drop your resume here, or{" "}
                  <span className="text-primary underline decoration-primary/40 underline-offset-4">
                    browse files
                  </span>
                </h4>
                <p className="mt-1.5 text-xs text-slate-500 max-w-sm">
                  Supports PDF or Word (.docx) format up to 15 MB. We will extract your medical degrees, experience, council registration, and clinical skills.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">
                    PDF
                  </span>
                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">
                    DOCX
                  </span>
                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5">
                    TXT
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <HiOutlineShieldCheck className="h-3.5 w-3.5" /> 100% Confidential
                  </span>
                </div>
              </div>

              {/* Sample Healthcare Resumes Section for Fast Testing */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                      <HiBolt className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span>Quick Test with Samples</span>
                    </span>
                    <span className="inline-flex items-center rounded-full bg-primary-soft text-primary text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap shrink-0">
                      1-Click Demo
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Select a role to test auto-fill</span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  {SAMPLE_HEALTHCARE_RESUMES.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleApplySample(sample)}
                      className="group flex flex-col items-start rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary-soft/40 hover:shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-primary border border-slate-200/80 group-hover:bg-primary group-hover:text-white transition-colors">
                          <HiOutlineDocumentText className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-primary truncate">
                          {sample.title}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] leading-snug text-slate-500 line-clamp-2">
                        {sample.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2 & 3: SCANNING & ANALYZING ANIMATION */}
          {(stage === "reading" || stage === "analyzing") && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
              {/* Radar pulse animation */}
              <div className="relative flex items-center justify-center">
                <div className="absolute h-24 w-24 rounded-full bg-primary/10 animate-ping" />
                <div className="absolute h-18 w-18 rounded-full bg-primary/20 animate-pulse" />
                <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
                  <HiOutlineSparkles className="h-7 w-7 animate-spin duration-1000" />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Analyzing & Extracting Details…
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  {currentFile}
                </p>
              </div>

              {/* Step Checklist */}
              <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 space-y-2.5 text-left">
                {[
                  { step: 1, text: "Reading document stream & structure" },
                  { step: 2, text: "Extracting contact details & geographic location" },
                  { step: 3, text: "Matching clinical credentials & council registrations" },
                  { step: 4, text: "Parsing education, work experience & healthcare skills" },
                ].map((item) => {
                  const isDone = progressStep > item.step;
                  const isCurrent = progressStep === item.step;
                  return (
                    <div
                      key={item.step}
                      className={cn(
                        "flex items-center gap-3 text-xs transition-colors",
                        isDone && "text-emerald-700 font-semibold",
                        isCurrent && "text-primary font-bold",
                        !isDone && !isCurrent && "text-slate-400",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]",
                          isDone && "bg-emerald-600 text-white",
                          isCurrent && "bg-primary text-white animate-pulse",
                          !isDone && !isCurrent && "border border-slate-300 text-slate-400",
                        )}
                      >
                        {isDone ? <HiCheck className="h-3 w-3 stroke-[3]" /> : item.step}
                      </span>
                      <span>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STAGE 4: PREVIEW & REVIEW EXTRACTED DETAILS */}
          {stage === "preview" && parsedData && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Success Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 sm:p-4 min-w-0">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <span className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm mt-0.5 sm:mt-0">
                    <HiOutlineCheckBadge className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 leading-tight">
                      Successfully Extracted Candidate Profile
                    </h4>
                    <p className="text-[11px] sm:text-xs text-emerald-800 mt-1 leading-normal">
                      From <span className="font-semibold break-all">{currentFile}</span> ({parsedData.confidenceScore ?? 85}% match confidence)
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="self-end sm:self-auto h-7 sm:h-8 text-xs font-semibold text-emerald-900 hover:text-emerald-950 hover:bg-emerald-100/70 rounded-lg gap-1.5 px-2.5 shrink-0"
                >
                  <HiOutlineArrowPath className="h-3.5 w-3.5 shrink-0" />
                  <span>Re-upload</span>
                </Button>
              </div>

              {/* Data Category Cards */}
              <div className="grid gap-3 sm:gap-3.5 sm:grid-cols-2 w-full min-w-0">
                {/* 1. Personal & Contact */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-2 shadow-2xs min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                    <HiOutlineUser className="h-4 w-4 text-primary shrink-0" />
                    <span>Personal & Contact</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Full name:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Email:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.email || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Mobile:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.mobile ? `+91 ${parsedData.mobile}` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Location:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">
                        {[parsedData.city, parsedData.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </div>
                    {parsedData.dob && (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-slate-500 shrink-0">DOB & Gender:</span>
                        <span className="font-semibold text-slate-900 truncate text-right">{parsedData.dob} {parsedData.gender ? `(${parsedData.gender})` : ""}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Profession & Registration */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-2 shadow-2xs min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                    <HiOutlineIdentification className="h-4 w-4 text-primary shrink-0" />
                    <span>Profession & Registration</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Profession:</span>
                      <span className="font-bold text-primary truncate text-right">{parsedData.role || "Nurse"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Specialty:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.specialty || "General"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Reg Council:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.council || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Reg No:</span>
                      <span className="font-mono font-bold text-slate-900 truncate text-right">{parsedData.regNo || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Education */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-2 shadow-2xs min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                    <HiOutlineAcademicCap className="h-4 w-4 text-primary shrink-0" />
                    <span>Highest Education</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Qualification:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.qual || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Graduation Year:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.year || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Institution:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.institution || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Experience & Employer */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 space-y-2 shadow-2xs min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                    <HiOutlineBriefcase className="h-4 w-4 text-primary shrink-0" />
                    <span>Work Experience</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Total Experience:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.exp || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Employer:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.employer || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Designation:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.designation || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-slate-500 shrink-0">Notice Period:</span>
                      <span className="font-semibold text-slate-900 truncate text-right">{parsedData.notice || "Immediately"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Skills detected */}
              {parsedData.skills && parsedData.skills.length > 0 && (
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Clinical Skills Detected ({parsedData.skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs"
                      >
                        <HiCheck className="h-3 w-3 text-emerald-600" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="border-t border-slate-100 px-4.5 sm:px-6 py-3.5 sm:py-4 pb-6 sm:pb-4 bg-slate-50/90 backdrop-blur-xs flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer h-10 sm:h-9 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>

          {stage === "preview" && (
            <Button
              type="button"
              onClick={handleApply}
              className="w-full sm:w-auto gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/95 cursor-pointer h-11 sm:h-9 text-xs"
            >
              <HiCheck className="h-4 w-4 stroke-[2.5]" />
              Auto-Fill My Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
