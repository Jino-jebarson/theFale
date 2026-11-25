import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { FacilityImage } from "@/components/fale/FacilityImage";
import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlinePencilSquare,
  HiOutlineGlobeAlt,
  HiOutlineBolt,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineDocumentCheck,
  HiOutlineDocumentText,
  HiOutlineIdentification,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineCamera,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineUserGroup,
  HiOutlineKey,
  HiOutlineTrash,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/fale/fields";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useApp, setState } from "@/lib/store";
import { isApiEnabled } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  getFacilityProfile,
  updateFacilityProfile,
  getFacilityDocuments,
  uploadFacilityDocument,
  getFacilityTeam,
  inviteFacilityTeamMember,
  removeFacilityTeamMember,
  type FacilityProfileDto,
  type FacilityDocumentDto,
  type FacilityTeamInviteDto,
} from "@/lib/adapters/facilityAdapter";
import { generateFacilityDocumentBlob } from "@/lib/clinicalDocumentPdf";
import { FACILITY_AREAS } from "@/lib/facilityAreas";
import { getCurrentUser, logout, updateFacilityPassword, type UserSummary } from "@/lib/adapters/authAdapter";

export const Route = createFileRoute("/employer/profile")({
  head: () => ({
    meta: [
      { title: "Hospital Profile & Institution Overview — FALE" },
      {
        name: "description",
        content:
          "Verified hospital institution profile, clinical departments, accreditations, and infrastructure details.",
      },
      { property: "og:title", content: "Hospital Profile — FALE Healthcare" },
      {
        property: "og:description",
        content: "Verified clinical institution profile, departments, and accreditations.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HospitalProfileScreen,
});

const defaultDepartments = [
  "Emergency & Trauma",
  "Critical Care Medicine (ICU)",
  "General Medicine",
  "General & Laparoscopic Surgery",
  "Cardiology",
  "Nephrology & Dialysis",
  "Pediatrics & Neonatology",
  "Orthopedics",
  "Obstetrics & Gynecology",
  "Anesthesiology",
];

const availableCities = [
  "Bengaluru",
  "Chennai",
  "Mumbai",
  "Hyderabad",
  "Delhi NCR",
  "Kolkata",
  "Pune",
  "Kochi",
  "Coimbatore",
  "Madurai",
];

const accreditationOptions = [
  "NABH Full Hospital Accreditation",
  "NABH Entry Level Certification",
  "JCI Gold Seal of Approval®",
  "NABL Certified Diagnostic Labs",
  "State Medical Council Approved",
  "KPME Registered Center",
];

function resolveFacilityArea(area: string | undefined, address: string | undefined, city: string | undefined) {
  const currentArea = area?.trim() || "";
  if (!/\b(?:ward|zone)\b/i.test(currentArea)) return currentArea;

  const addressParts = (address || "").split(",").map((part) => part.trim()).filter(Boolean);
  const wardPartIndex = addressParts.findIndex((part) => /\bward\b/i.test(part));
  const nearbyParts = wardPartIndex >= 0 ? addressParts.slice(wardPartIndex + 1) : addressParts;
  for (const part of nearbyParts) {
    const locality = part.replace(/^\s*(?:zone|ward)\s*\d*\s*/i, "").trim();
    if (!locality || /\b(?:ward|zone|district|metropolitan area)\b/i.test(locality) || /^\d{6}$/.test(locality)) continue;
    if (city && locality.toLowerCase() === city.trim().toLowerCase()) continue;
    if (/^(india|tamil nadu)$/i.test(locality)) continue;
    return locality;
  }
  return city?.trim() || "";
}

type EditSection = "identity" | "about" | "credentials" | "address" | "specialties" | "contact" | null;

interface PreviewModalState {
  title: string;
  fileName: string;
  url: string;
  isImage: boolean;
}

function HospitalProfileScreen() {
  const pageLoad = usePageLoad();
  const pageAction = useConfirmedAction();
  const store = useApp();
  const profile = (store.profile || {}) as Record<string, any>;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facilityData, setFacilityData] = useState<FacilityProfileDto | null>(null);
  const [facilityDocs, setFacilityDocs] = useState<FacilityDocumentDto[]>([]);
  const [facilityTeam, setFacilityTeam] = useState<FacilityTeamInviteDto[]>([]);
  const [accountUser, setAccountUser] = useState<UserSummary | null>(null);
  const [facilityPhotos, setFacilityPhotos] = useState<string[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamPhone, setTeamPhone] = useState("");
  const [teamSaving, setTeamSaving] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Form / Display State
  const [hospitalName, setHospitalName] = useState(profile["org"] || "Healthcare Facility");
  const [facilityType, setFacilityType] = useState("");
  const [about, setAbout] = useState("");
  const [branchName, setBranchName] = useState("");
  const [area, setArea] = useState(profile["area"] || "");
  const [city, setCity] = useState(profile["city"] || "");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressLine, setAddressLine] = useState(profile["address"] || "");
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [beds, setBeds] = useState("");
  const [icuBeds, setIcuBeds] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [gst, setGst] = useState("");
  const [nabhNumber, setNabhNumber] = useState("");
  const [accreditationLevel, setAccreditationLevel] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [designation, setDesignation] = useState("");
  const [contactPhone, setContactPhone] = useState(profile["phone"] || "");
  const [contactEmail, setContactEmail] = useState(profile["email"] || "");
  const [website, setWebsite] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDeptInput, setNewDeptInput] = useState("");

  // Section Edit Modal
  const [editSection, setEditSection] = useState<EditSection>(null);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<PreviewModalState | null>(null);

  // Logo upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(profile["logoUrl"] || null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [data, docs] = await Promise.all([
          getFacilityProfile(),
          getFacilityDocuments(),
        ]);
        const [teamResult, userResult] = await Promise.allSettled([getFacilityTeam(), getCurrentUser()]);

        if (data && isMounted) {
          setFacilityData(data);
          if (teamResult.status === "fulfilled") setFacilityTeam(teamResult.value);
          else console.error("Failed to load facility team invitations:", teamResult.reason);
          if (userResult.status === "fulfilled") setAccountUser(userResult.value);
          else console.error("Failed to load facility account details:", userResult.reason);
          if (data.hospitalName) setHospitalName(data.hospitalName);
          if (data.facilityType) setFacilityType(data.facilityType);
          if (data.about) setAbout(data.about);
          if (data.branchName) setBranchName(data.branchName);
          if (data.area) setArea(resolveFacilityArea(data.area, data.addressLine, data.city));
          if (data.city) setCity(data.city);
          if (data.state) setStateName(data.state);
          if (data.pincode) setPincode(data.pincode);
          else {
            const addressPincode = data.addressLine?.match(/\b[1-9]\d{5}\b/)?.[0];
            if (addressPincode) setPincode(addressPincode);
          }
          if (data.addressLine) setAddressLine(data.addressLine);
          if (data.beds !== undefined && data.beds !== null) setBeds(String(data.beds));
          if (data.icuBeds !== undefined && data.icuBeds !== null) setIcuBeds(String(data.icuBeds));
          if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
          if (data.gst) setGst(data.gst);
          if (data.nabhNumber) setNabhNumber(data.nabhNumber);
          if (data.accreditationLevel) setAccreditationLevel(data.accreditationLevel);
          if (data.contactPerson) setContactPerson(data.contactPerson);
          if (data.designation) setDesignation(data.designation);
          if (data.contactPhone) setContactPhone(data.contactPhone);
          if (data.contactEmail) setContactEmail(data.contactEmail);
          if (data.website) setWebsite(data.website);
          setLogoUrl(data.logoUrl || null);
          setFacilityPhotos(data.facilityPhotos || []);
          if (data.departments && data.departments.length > 0) {
            setDepartments(data.departments);
          }
          if (data.documents && data.documents.length > 0) {
            setFacilityDocs(data.documents);
          } else if (docs && docs.length > 0) {
            setFacilityDocs(docs);
          }
        }
      } catch (err) {
      pageLoad.fail(err);
        console.error("Failed to load facility profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [pageLoad.retryKey]);

  const handleAddDepartment = () => {
    const val = newDeptInput.trim();
    if (!val) return;
    if (departments.some((d) => d.toLowerCase() === val.toLowerCase())) {
      toast.info("Specialty already added");
      return;
    }
    setDepartments([...departments, val]);
    setNewDeptInput("");
  };

  const handleRemoveDepartment = (depToRemove: string) => {
    setDepartments(departments.filter((d) => d !== depToRemove));
  };

  const useCurrentAddress = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser.");
      return;
    }
    setLocatingAddress(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=en`, {
          headers: { Accept: "application/json", "Accept-Language": "en" },
        });
        if (!response.ok) throw new Error("Address lookup failed");
        const result = await response.json();
        const detected = result.address ?? {};
        const detectedCity = detected.city || detected.town || detected.municipality || detected.village || detected.county || "";
        const detectedArea = [detected.neighbourhood, detected.suburb, detected.city_district, detected.quarter, detected.residential]
          .find((value) => value && !/\b(?:ward|zone)\b/i.test(String(value))) || detectedCity;
        if (result.display_name) setAddressLine(String(result.display_name));
        if (detectedArea) setArea(String(detectedArea));
        if (detectedCity) setCity(String(detectedCity));
        if (detected.state) setStateName(String(detected.state));
        if (detected.postcode) setPincode(String(detected.postcode));
        toast.success("Current address added", { description: "Review the address and edit it if needed." });
      } catch {
        toast.error("Could not identify your address", { description: "Enter your campus address manually." });
      } finally {
        setLocatingAddress(false);
      }
    }, (failure) => {
      setLocatingAddress(false);
      toast.error(failure.code === 1 ? "Location permission was denied" : "Could not get your current location", {
        description: failure.code === 1 ? "Allow location access in your browser and try again, or enter your address manually." : "Check your device location settings, or enter your address manually.",
      });
    }, { enableHighAccuracy: false, maximumAge: 300000, timeout: 15000 });
  };

  const handleSaveSection = async () => { await pageAction.run(async () => {
    try {
      setSaving(true);
      const parsedBeds = parseInt(beds, 10);
      const parsedIcuBeds = parseInt(icuBeds, 10) || 0;

      const payload: Partial<FacilityProfileDto> = {
        hospitalName: hospitalName.trim(),
        facilityType: facilityType.trim(),
        about: about.trim(),
        area: area.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        addressLine: addressLine.trim(),
        ...(Number.isFinite(parsedBeds) && parsedBeds > 0 ? { beds: parsedBeds } : {}),
        icuBeds: parsedIcuBeds,
        licenseNumber: licenseNumber.trim(),
        gst: gst.trim(),
        nabhNumber: nabhNumber.trim(),
        accreditationLevel: accreditationLevel.trim(),
        contactPerson: contactPerson.trim(),
        designation: designation.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        website: website.trim(),
        branchName: branchName.trim(),
        departments,
        logoUrl: logoUrl || undefined,
        facilityPhotos,
      };

      {
        const updated = await updateFacilityProfile(payload);
        setFacilityData(updated);
      }

      setState((s) => ({
        profile: {
          ...s.profile,
          org: hospitalName,
          area,
          city,
          address: addressLine,
          bedCapacity: beds,
          icuBeds,
          contactPhone,
          contactEmail,
          website,
          branchName,
          logoUrl,
        },
      }));

      setEditSection(null);
      toast.success("Hospital details updated successfully");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast.error(err?.message || "Failed to update hospital profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }); };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      const previousLogo = logoUrl;
      setLogoUrl(dataUrl);

      {
        try {
          await updateFacilityProfile({ logoUrl: dataUrl });
          toast.success("Hospital logo updated");
        } catch (error: any) {
          setLogoUrl(previousLogo);
          toast.error(error?.message || "Could not save the hospital logo. Please try again.");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    try {
      await updateFacilityProfile({ logoUrl: "" });
      setLogoUrl(null);
      toast.success("Facility logo removed");
    } catch (error: any) {
      toast.error(error?.message || "Could not remove the facility logo.");
    }
  };

  const handleFacilityPhotosSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const availableSlots = Math.max(0, 6 - facilityPhotos.length);
    if (!availableSlots) {
      toast.error("You can add up to 6 facility photos.");
      return;
    }
    const selected = files.slice(0, availableSlots);
    if (files.length > availableSlots) toast.info(`Only ${availableSlots} more photo${availableSlots === 1 ? "" : "s"} can be added.`);
    try {
      const optimizedPhotos = await Promise.all(selected.map(async (file) => {
        if (!file.type.startsWith("image/")) throw new Error("Choose JPG, PNG, or WebP images.");
        if (file.size > 12 * 1024 * 1024) throw new Error("Each photo must be under 12 MB before compression.");
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1440 / bitmap.width, 1440 / bitmap.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        if (!context) { bitmap.close(); throw new Error("Could not process a facility photo."); }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        return canvas.toDataURL("image/jpeg", 0.78);
      }));
      const nextPhotos = [...facilityPhotos, ...optimizedPhotos].slice(0, 6);
      await updateFacilityProfile({ facilityPhotos: nextPhotos });
      setFacilityPhotos(nextPhotos);
      toast.success(`${optimizedPhotos.length} facility photo${optimizedPhotos.length === 1 ? "" : "s"} saved`);
    } catch (error: any) {
      toast.error(error?.message || "Could not save facility photos.");
    }
  };

  const handleRemoveFacilityPhoto = async (index: number) => {
    const nextPhotos = facilityPhotos.filter((_, photoIndex) => photoIndex !== index);
    try {
      await updateFacilityProfile({ facilityPhotos: nextPhotos });
      setFacilityPhotos(nextPhotos);
      toast.success("Facility photo removed");
    } catch (error: any) {
      toast.error(error?.message || "Could not remove this photo.");
    }
  };

  const handleInviteTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (teamName.trim().length < 2) { toast.error("Enter the teammate’s name."); return; }
    if (!/^(?:\+?91[ -]?)?[6-9]\d{9}$/.test(teamPhone.trim())) { toast.error("Enter a valid 10-digit Indian mobile number."); return; }
    try {
      setTeamSaving(true);
      const invited = await inviteFacilityTeamMember({ name: teamName.trim(), phone: teamPhone.trim() });
      setFacilityTeam((current) => [invited, ...current]);
      setTeamName("");
      setTeamPhone("");
      toast.success("Team invitation saved. Share it with your teammate on WhatsApp.");
    } catch (error: any) {
      toast.error(error?.message || "Could not create the team invitation.");
    } finally {
      setTeamSaving(false);
    }
  };

  const handleRemoveTeamInvite = async (id: string) => {
    try {
      await removeFacilityTeamMember(id);
      setFacilityTeam((current) => current.filter((member) => member.id !== id));
      toast.success("Team invitation removed");
    } catch (error: any) {
      toast.error(error?.message || "Could not remove this invitation.");
    }
  };

  const handleSaveFacilityPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) { toast.error("Use at least 8 characters for your password."); return; }
    if (newPassword !== confirmPassword) { toast.error("The passwords do not match."); return; }
    if (accountUser?.passwordConfigured && !currentPassword) { toast.error("Enter your current password."); return; }
    try {
      setPasswordSaving(true);
      await updateFacilityPassword({ ...(accountUser?.passwordConfigured ? { currentPassword } : {}), newPassword });
      setAccountUser((current) => current ? { ...current, passwordConfigured: true } : current);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setAccountDialogOpen(false);
      toast.success("Sign-in password updated");
    } catch (error: any) {
      toast.error(error?.message || "Could not update your password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleFacilitySignOut = async () => {
    await logout();
    window.location.assign("/");
  };

  const handleDocumentReplace = (docType: string, docTitle: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg,.webp";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      if (file.size > 15 * 1024 * 1024) {
        toast.error("File size must be under 15 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Url = ev.target?.result as string;
        if (!base64Url) return;
        try {
          toast.loading(`Uploading ${docTitle}...`, { id: "vault-upload" });
          await uploadFacilityDocument({
            documentType: docType,
            originalFileName: file.name,
            fileUrl: base64Url,
          });
          toast.success(`${docTitle} uploaded successfully!`, { id: "vault-upload" });
          const docs = await getFacilityDocuments();
          setFacilityDocs(docs);
        } catch (err: any) {
      pageLoad.fail(err);
          toast.error("Upload failed: " + (err?.message || "Server error"), { id: "vault-upload" });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handlePreviewDocument = (doc: {
    title: string;
    fileName: string;
    type: string;
    fileUrl?: string;
  }) => {
    const url = doc.fileUrl;
    if (!url || !/^(https?:|blob:|data:application\/pdf|data:image\/|\/)/i.test(url)) {
      toast.error("No uploaded document is available. Please upload a document first.");
      return;
    }
    const isImage = url.startsWith("data:image/") || /\.(png|jpe?g|webp|gif)$/i.test(doc.fileName);
    setPreviewDoc({ title: doc.title, fileName: doc.fileName, url, isImage });
  };

    const handleCopyAddress = () => {
      const fullAddr = [addressLine, city, stateName, pincode].filter(Boolean).join(", ");
      navigator.clipboard?.writeText(fullAddr || addressLine);
      toast.success("Hospital campus address copied to clipboard");
    };

    const fullDisplayAddress = [addressLine, city, stateName, pincode].filter(Boolean).join(", ");
    const kycStatus = facilityData?.kycStatus?.toUpperCase();
    const isVerified = kycStatus ? kycStatus === "VERIFIED" : Boolean(store.profile?.isVerified);

    // Format document titles into institutional nomenclature
    const formatDocumentTitle = (typeOrKey: string): string => {
      const k = typeOrKey.toUpperCase();
      if (k.includes("REGISTRATION") || k.includes("LICENCE") || k.includes("LICENSE")) {
        return "Clinical Establishment Act (CEA) License";
      }
      if (k.includes("GST")) {
        return "Goods & Services Tax (GSTIN) Registration";
      }
      if (k.includes("REPRESENTATIVE") || k.includes("AUTHORIZATION")) {
        return "Representative Authorization Letter";
      }
      if (k.includes("NABH") || k.includes("ACCREDITATION") || k.includes("NABL")) {
        return "Hospital Accreditation & Standards Certificate";
      }
      if (k.includes("FIRE")) {
        return "Fire & Life Safety Clearance NOC";
      }
      if (k.includes("POLLUTION")) {
        return "State Pollution Control Board Clearance";
      }
      if (k.includes("BMW") || k.includes("WASTE")) {
        return "Bio-Medical Waste Authorization";
      }
      return typeOrKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // Format file extension and size cleanly
    const formatDocumentMeta = (fileName: string, sizeBytes?: number): string => {
      const ext = fileName.split(".").pop()?.toUpperCase() || "";
      const isImg = ["PNG", "JPG", "JPEG", "WEBP"].includes(ext);
      const typeLabel = isImg ? `${ext} Image` : ext === "PDF" ? "PDF Document" : "Official Document";
      if (sizeBytes && sizeBytes > 1024) {
        const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
        return `${sizeMb} MB • ${typeLabel}`;
      }
      return typeLabel;
    };

    // Build the statutory document vault list purely from actual documents received during onboarding
    const docVaultList = useMemo(() => {
      // 1. If backend facility documents exist, use them directly (excluding generic photo albums)
      const validBackendDocs = (facilityDocs || []).filter(
        (d) =>
          d.documentType !== "FACILITY_PHOTOS" &&
          d.documentType !== "HOSPITAL_PHOTO" &&
          Boolean(d.originalFileName) &&
          !d.originalFileName.toLowerCase().includes("photos uploaded")
      );

      if (validBackendDocs.length > 0) {
        return validBackendDocs.map((doc) => ({
          id: doc.id,
          type: doc.documentType,
          title: formatDocumentTitle(doc.documentType),
          fileName: doc.originalFileName,
          fileUrl: doc.fileUrl,
          verified: isVerified || Boolean(doc.verified),
          sizeText: formatDocumentMeta(doc.originalFileName, doc.fileSizeBytes),
        }));
      }

      // 2. Fallback to store.docs (saved during onboarding session)
      const storeDocs = (store.docs || {}) as Record<string, string>;
      const listFromStore = Object.entries(storeDocs)
        .filter(([label, fileName]) => Boolean(fileName) && !label.toLowerCase().includes("photo"))
        .map(([label, fileName], idx) => ({
          id: `store-doc-${idx}`,
          type: label.toUpperCase().replace(/[^A-Z0-9]/g, "_"),
          title: formatDocumentTitle(label),
          fileName,
          fileUrl: (store as any).docDataUrls?.[label] || "",
          verified: isVerified,
          sizeText: formatDocumentMeta(fileName),
        }));

      return listFromStore;
    }, [facilityDocs, store.docs, isVerified]);

    const registrationCertificateDoc = docVaultList.find((doc) => doc.type.toUpperCase() === "FACILITY_REGISTRATION");
    const hasRegistrationCertificate = Boolean(registrationCertificateDoc);
    const otherFacilityDocs = docVaultList.filter((doc) => doc.type.toUpperCase() !== "FACILITY_REGISTRATION");
    const isFacilityRejected = facilityData?.kycStatus?.toUpperCase() === "REJECTED";
    const verificationStatusLabel = isVerified
      ? "Verified by The Fale"
      : isFacilityRejected
        ? "Action required"
        : hasRegistrationCertificate
          ? "Under review"
          : "Registration certificate required";
    const optionalFacilityDocuments = [
      { type: "GST_CERTIFICATE", title: "GST certificate" },
      { type: "REPRESENTATIVE_AUTHORIZATION", title: "Authorized representative letter" },
      { type: "NABH_CERTIFICATE", title: "NABH / NABL certificate" },
      { type: "FIRE_SAFETY", title: "Fire safety clearance" },
      { type: "POLLUTION_CONTROL", title: "Pollution control clearance" },
      { type: "BMW_AUTHORIZATION", title: "Bio-medical waste authorization" },
    ];

    return (
      <AppShell>
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
        <div className="mx-auto max-w-6xl space-y-6 pb-20 min-w-0">
          <header className="space-y-1 px-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Your facility</p>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Facility profile</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Keep your facility information current and submit the documents needed for verification.</p>
          </header>

          <div className="bg-card rounded-3xl border border-border shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6">
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleLogoSelect} className="hidden" />
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" id="facility-photos-input" onChange={handleFacilityPhotosSelect} />
              <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-x-5">
                  <div className="relative h-[72px] w-[72px] shrink-0 sm:h-[88px] sm:w-[88px]">
                    <button type="button" onClick={() => logoInputRef.current?.click()} title="Update facility logo" className="relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-primary-soft text-primary shadow-sm">
                    {logoUrl ? <FacilityImage src={logoUrl} alt={hospitalName} className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-2xl font-black">{hospitalName.slice(0, 2).toUpperCase()}</span>}
                    </button>
                    <span className="pointer-events-none absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-primary text-white shadow"><HiOutlineCamera className="h-4 w-4" /></span>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-xl font-black tracking-tight text-foreground sm:text-2xl">{hospitalName}</h2>
                      {isVerified && <RiVerifiedBadgeFill className="h-5 w-5 shrink-0 text-emerald-500" title="Verified by The Fale" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {facilityType && <span className="rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 font-bold text-primary">{facilityType}</span>}
                      {branchName && <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-semibold text-muted-foreground">{branchName}</span>}
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-bold", isVerified ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : isFacilityRejected ? "border-rose-500/20 bg-rose-500/10 text-rose-700" : "border-amber-500/20 bg-amber-500/10 text-amber-700")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", isVerified ? "bg-emerald-500" : isFacilityRejected ? "bg-rose-500" : "bg-amber-500")} />
                        {verificationStatusLabel}
                      </span>
                    </div>
                    {(area || city || stateName || Number(beds) > 0 || licenseNumber) && <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {(area || city || stateName) && <span className="inline-flex items-center gap-1"><HiOutlineMapPin className="h-3.5 w-3.5 shrink-0 text-primary" />{Array.from(new Set([area, city, stateName].filter(Boolean))).join(", ")}</span>}
                      {Number(beds) > 0 && <span>{beds} inpatient beds{Number(icuBeds) > 0 ? ` · ${icuBeds} ICU` : ""}</span>}
                      {licenseNumber && <span className="inline-flex items-center gap-1"><HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />Registration: {licenseNumber}</span>}
                    </div>}
                  </div>
                <div className="col-span-2 flex w-full gap-2 sm:col-span-1 sm:w-auto">
                  <Button variant="outline" size="sm" onClick={() => setEditSection("identity")} className="h-10 flex-1 cursor-pointer gap-1.5 rounded-xl px-4 text-xs font-bold sm:h-9 sm:flex-initial">
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />Edit profile
                  </Button>
                  <Button asChild size="sm" className="h-10 flex-1 cursor-pointer gap-1.5 rounded-xl px-4 text-xs font-bold sm:h-9 sm:flex-initial">
                    <Link to="/employer/post-shift"><HiOutlineBolt className="h-3.5 w-3.5" />Post a shift</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-border bg-card p-4 shadow-xs sm:p-6" aria-labelledby="facility-verification-title">
            <div className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
              <span className={cn("row-span-2 grid h-10 w-10 shrink-0 place-items-center rounded-xl", isVerified ? "bg-emerald-500/10 text-emerald-600" : isFacilityRejected ? "bg-rose-500/10 text-rose-600" : "bg-primary-soft text-primary")}>
                {isVerified ? <HiOutlineCheckBadge className="h-5 w-5" /> : <HiOutlineDocumentCheck className="h-5 w-5" />}
              </span>
              <div className="flex min-w-0 items-center">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">Facility verification</p>
              </div>
              <div className="col-start-2 min-w-0">
                <h2 id="facility-verification-title" className="mt-1 text-base font-extrabold text-foreground sm:text-lg">
                  {isVerified ? "Your facility is verified" : isFacilityRejected ? "Update your registration certificate" : hasRegistrationCertificate ? "Registration certificate received" : "Upload your hospital registration certificate"}
                </h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                  {isVerified
                    ? "Your hospital registration has been reviewed and verified by The Fale."
                    : isFacilityRejected
                      ? "The certificate needs an update before verification can be completed. Replace it to request another review."
                      : hasRegistrationCertificate
                        ? "The Fale team is reviewing your certificate. We aim to complete reviews within one working day."
                        : "This is the only document required to start hospital verification. Our team reviews it within one working day."}
                </p>
                <span className={cn("mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-bold", isVerified ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : isFacilityRejected ? "border-rose-500/20 bg-rose-500/10 text-rose-700" : hasRegistrationCertificate ? "border-amber-500/20 bg-amber-500/10 text-amber-700" : "border-border bg-muted/40 text-muted-foreground")}>
                  {isVerified ? "Verified" : isFacilityRejected ? "Action required" : hasRegistrationCertificate ? "Under review" : "Required"}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-primary"><HiOutlineDocumentText className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Hospital registration certificate</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {registrationCertificateDoc?.fileName || "Clinical establishment or hospital registration licence · PDF or image, max 15 MB"}
                  </p>
                </div>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row">
                {registrationCertificateDoc && <Button type="button" variant="outline" size="sm" onClick={() => handlePreviewDocument(registrationCertificateDoc)} className="h-9 w-full min-w-0 cursor-pointer rounded-xl px-3 text-xs sm:w-auto"><HiOutlineEye className="mr-1.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 whitespace-normal text-center leading-tight">Preview</span></Button>}
                <Button type="button" size="sm" variant={registrationCertificateDoc ? "outline" : "default"} onClick={() => handleDocumentReplace("FACILITY_REGISTRATION", "Hospital registration certificate")} className="h-9 w-full min-w-0 cursor-pointer rounded-xl px-3 text-xs sm:w-auto">
                  <HiOutlineArrowUpTray className="mr-1 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 whitespace-normal text-center leading-tight">{registrationCertificateDoc ? "Replace certificate" : "Upload certificate"}</span>
                </Button>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* Profile details and verification documents */}
          {/* ========================================================================= */}
          <div className="space-y-6">
            {/* ======================================================================= */}
            {/* Verification documents */}
            {/* ======================================================================= */}
            <div className="space-y-6">
              {/* DOCUMENT VAULT */}
              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineDocumentCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Document Vault
                      </h2>
                      <p className="text-[11px] leading-4 text-muted-foreground sm:truncate">
                        Optional compliance and accreditation documents
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="shrink-0 whitespace-nowrap text-[10px] font-bold border-primary/20 bg-primary/5 text-primary px-2.5 py-1 rounded-full leading-none"
                  >
                        {otherFacilityDocs.length} Attached
                  </Badge>
                </div>

                {!isVerified && <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs font-bold text-foreground">What happens after you submit?</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">The Fale team reviews your registration certificate. We’ll update the verification status here if we need anything else.</p>
                </div>}
                <div className="space-y-3">
                  {otherFacilityDocs.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-border bg-muted/10 space-y-2">
                      <p className="text-xs font-bold text-foreground">No additional compliance documents uploaded</p>
                      <p className="text-[11px] text-muted-foreground">
                        These documents are optional and are not required to start hospital verification.
                      </p>
                    </div>
                  ) : (
                    otherFacilityDocs.map((doc) => (
                      <div
                        key={doc.id || doc.type}
                        className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-card text-primary shrink-0 border border-border/80">
                              <HiOutlineDocumentText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {doc.title}
                              </p>
                              <p className="text-[10px] font-mono text-muted-foreground truncate">
                                {doc.fileName}
                              </p>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold border leading-none flex items-center gap-1",
                              doc.verified
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", doc.verified ? "bg-emerald-500" : "bg-amber-500")} />
                            <span>{doc.verified ? "Verified" : "Under Audit"}</span>
                          </span>
                        </div>

                        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                          <span className="text-muted-foreground font-medium text-[10px]">
                            {doc.sizeText}
                          </span>

                          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentReplace(doc.type, doc.title)}
                              className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer rounded-xl flex-1 sm:flex-initial"
                            >
                              <HiOutlineArrowUpTray className="h-3.5 w-3.5 mr-1" />
                              <span>Replace</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewDocument(doc)}
                              className="h-7 px-2.5 text-xs font-bold text-primary border-primary/25 hover:bg-primary-soft cursor-pointer rounded-xl flex-1 sm:flex-initial"
                            >
                              <HiOutlineEye className="h-3.5 w-3.5 mr-1" />
                              <span>Preview</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-3.5 sm:p-4">
                  <div className="mb-3">
                    <p className="text-xs font-bold text-foreground">Other compliance documents <span className="font-medium text-muted-foreground">(if applicable)</span></p>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Upload documents that apply to your facility. These do not replace the required facility registration certificate.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {optionalFacilityDocuments.map((document) => {
                      const uploaded = docVaultList.some((doc) => doc.type.toUpperCase() === document.type);
                      return (
                        <Button key={document.type} type="button" variant="outline" size="sm" onClick={() => handleDocumentReplace(document.type, document.title)} className="h-auto min-h-8 max-w-full cursor-pointer rounded-xl px-2.5 py-1.5 text-left text-[11px]">
                          {uploaded ? <HiOutlineCheckCircle className="mr-1.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <HiOutlinePlus className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />}
                          <span className="break-words">{document.title}</span>
                          {uploaded && <span className="ml-1 text-emerald-600">Added</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* ======================================================================= */}
            {/* Facility information */}
            {/* ======================================================================= */}
            <header className="space-y-1 px-1">
              <h2 className="text-base font-extrabold text-foreground">Facility details</h2>
              <p className="text-xs leading-5 text-muted-foreground">These details help professionals understand your facility and its clinical services.</p>
            </header>
            <div className="space-y-6">
              {/* 1. ABOUT THE INSTITUTION */}
              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3 sm:items-center">
                  <div className="flex min-w-0 items-start gap-2 sm:items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineBuildingOffice2 className="h-4 w-4" />
                    </span>
                    <h3 className="min-w-0 text-[11px] font-bold uppercase tracking-wide text-primary sm:text-xs sm:tracking-wider">
                      About the Institution
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("about")}
                    className="shrink-0 rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    {about.trim() ? <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" /> : <HiOutlinePlus className="h-3.5 w-3.5 text-primary" />}
                    <span>{about.trim() ? "Edit" : "Add"}</span>
                  </Button>
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                  {about || <span className="italic text-muted-foreground">Add a short introduction about your facility and the care you provide.</span>}
                </p>
              </div>

              {/* 2. SPECIALTIES & CLINICAL DEPARTMENTS */}
              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3 sm:items-center">
                  <div className="flex min-w-0 items-start gap-2 sm:items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineBolt className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[11px] font-bold uppercase leading-4 tracking-wide text-foreground sm:text-xs sm:tracking-wider">
                        Specialties &amp; Clinical Departments
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {departments.length} Sanctioned Clinical Units
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("specialties")}
                    className="shrink-0 rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    {departments.length > 0 ? <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" /> : <HiOutlinePlus className="h-3.5 w-3.5 text-primary" />}
                    <span>{departments.length > 0 ? "Edit" : "Add"}</span>
                  </Button>
                </div>

                {departments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No departments added yet. Add the clinical units available at your facility.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept) => (
                      <span
                        key={dept}
                        className="rounded-xl bg-muted/60 border border-border/80 px-3 py-1.5 text-xs font-semibold text-foreground/90 hover:border-primary/40 transition-colors"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. CAMPUS ADDRESS & LOCATION */}
              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3 sm:items-center">
                  <div className="flex min-w-0 items-start gap-2 sm:items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineMapPin className="h-4 w-4" />
                    </span>
                    <h3 className="text-[11px] font-bold uppercase leading-4 tracking-wide text-foreground sm:text-xs sm:tracking-wider">
                      Hospital Campus Address
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("address")}
                    className="shrink-0 rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    {addressLine.trim() ? <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" /> : <HiOutlinePlus className="h-3.5 w-3.5 text-primary" />}
                    <span>{addressLine.trim() ? "Edit" : "Add"}</span>
                  </Button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground leading-relaxed text-xs sm:text-sm">
                    {addressLine || "Facility address not added"}
                  </p>
                  {branchName && <p className="text-foreground">Branch: <span className="font-semibold">{branchName}</span></p>}
                  <p className="text-muted-foreground font-medium">
                    {Array.from(new Set([area, city, stateName].filter(Boolean))).join(", ")}{pincode ? ` - ${pincode}` : ""}{area || city || stateName || pincode ? ", India" : "Location not added"}
                  </p>
                </div>
              </div>

              {/* 4. INSTITUTIONAL CREDENTIALS & LICENSING */}
              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3 sm:items-center">
                  <div className="flex min-w-0 items-start gap-2 sm:items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineIdentification className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[11px] font-bold uppercase leading-4 tracking-wide text-foreground sm:text-xs sm:tracking-wider">
                        Institutional Credentials &amp; Licensing
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Statutory Registrations &amp; Tax IDs
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("credentials")}
                    className="shrink-0 rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    {licenseNumber.trim() || accreditationLevel.trim() || nabhNumber.trim() || gst.trim()
                      ? <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />
                      : <HiOutlinePlus className="h-3.5 w-3.5 text-primary" />}
                    <span>{licenseNumber.trim() || accreditationLevel.trim() || nabhNumber.trim() || gst.trim() ? "Edit" : "Add"}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CEA License */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Clinical Establishment Reg.
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        KPME / CEA
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-foreground">
                      {licenseNumber || "Not provided"}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      {isVerified ? "Verified by The Fale" : "Awaiting verification"}
                    </span>
                  </div>

                  {/* Accreditation Level */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Accreditation Level
                      </span>
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        Standard
                      </span>
                    </div>
                    <p className="text-xs font-bold text-foreground truncate">
                      {accreditationLevel}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      NABH / Quality Council of India
                    </span>
                  </div>

                  {/* NABH Reference */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        NABH Reference No.
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Reference
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-foreground">
                      {nabhNumber || "Not provided"}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Hospital Quality Compliance
                    </span>
                  </div>

                  {/* GSTIN */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        GSTIN Identification
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Tax Reg
                      </span>
                    </div>
                    <p className="text-xs font-mono font-bold text-foreground">
                      {gst || "Not provided"}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Valid for GST Input &amp; Tax Invoices
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. ADMINISTRATIVE & STAFFING DESK */}
              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3 sm:items-center">
                  <div className="flex min-w-0 items-start gap-2 sm:items-center">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlinePhone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[11px] font-bold uppercase leading-4 tracking-wide text-foreground sm:text-xs sm:tracking-wider">
                        Administrative &amp; Staffing Desk
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Direct Operational Contacts
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("contact")}
                    className="shrink-0 rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    {contactPerson.trim() || designation.trim() || contactPhone.trim() || contactEmail.trim() || website.trim()
                      ? <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />
                      : <HiOutlinePlus className="h-3.5 w-3.5 text-primary" />}
                    <span>{contactPerson.trim() || designation.trim() || contactPhone.trim() || contactEmail.trim() || website.trim() ? "Edit" : "Add"}</span>
                  </Button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Contact Person */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 gap-1">
                    <span className="text-muted-foreground font-medium">Administrator / Lead:</span>
                    <span className="font-bold text-foreground">
                      {contactPerson} {designation ? `(${designation})` : ""}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-t border-border/60 gap-1">
                    <span className="text-muted-foreground font-medium">Official Phone:</span>
                    {contactPhone ? (
                      <a
                        href={`tel:${contactPhone}`}
                        className="font-mono font-bold text-foreground hover:text-primary flex items-center gap-1.5"
                      >
                        <HiOutlinePhone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{contactPhone}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-t border-border/60 gap-1">
                    <span className="text-muted-foreground font-medium">Official Email:</span>
                    {contactEmail ? (
                      <a
                        href={`mailto:${contactEmail}`}
                        className="font-medium text-primary hover:underline flex items-center gap-1.5 truncate max-w-full sm:max-w-[240px]"
                      >
                        <HiOutlineEnvelope className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{contactEmail}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>

                  {/* Website */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-t border-border/60 gap-1">
                    <span className="text-muted-foreground font-medium">Hospital Portal:</span>
                    {website ? (
                      <a
                        href={website.startsWith("http") ? website : `https://${website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1 text-xs"
                      >
                        <HiOutlineGlobeAlt className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Visit Portal</span>
                        <HiOutlineArrowTopRightOnSquare className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">Facility photos <span className="font-medium text-muted-foreground">({facilityPhotos.length}/6)</span></h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Show candidates the spaces where they may work, such as wards, theatres, and staff areas.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" disabled={facilityPhotos.length >= 6} onClick={() => document.getElementById("facility-photos-input")?.click()} className="h-9 shrink-0 cursor-pointer rounded-xl text-xs font-bold">
                    <HiOutlinePlus className="mr-1.5 h-4 w-4" />Add photos
                  </Button>
                </div>
                {facilityPhotos.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {facilityPhotos.map((photo, index) => (
                      <div key={`${index}-${photo.slice(0, 24)}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted/20">
                        <FacilityImage src={photo} alt={`${hospitalName} facility photo ${index + 1}`} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => void handleRemoveFacilityPhoto(index)} aria-label={`Remove facility photo ${index + 1}`} className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/70 text-white opacity-100 shadow transition hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"><HiOutlineTrash className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button type="button" onClick={() => document.getElementById("facility-photos-input")?.click()} className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/10 px-4 text-center text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary">
                    <HiOutlinePlus className="h-5 w-5" />Add facility photos
                  </button>
                )}
              </div>

              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><HiOutlineUserGroup className="h-5 w-5" /></span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">Team contacts</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Save collaborators and share an invitation through WhatsApp.</p>
                  </div>
                </div>
                <form onSubmit={handleInviteTeam} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Team member name" maxLength={100} className="h-10 min-w-0 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                  <input value={teamPhone} onChange={(event) => setTeamPhone(event.target.value)} placeholder="Mobile number" type="tel" inputMode="tel" className="h-10 min-w-0 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                  <Button type="submit" disabled={teamSaving} className="h-10 cursor-pointer rounded-xl px-4 text-xs font-bold">{teamSaving ? "Saving…" : "Add contact"}</Button>
                </form>
                {facilityTeam.length ? (
                  <div className="divide-y divide-border rounded-2xl border border-border px-3">
                    {facilityTeam.map((member) => {
                      const inviteMessage = `Hi ${member.name}, ${hospitalName} has added you as a facility team contact on The Fale. Please contact the facility administrator to arrange workspace access.`;
                      return <div key={member.id} className="flex min-w-0 items-center gap-3 py-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">{member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                        <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-foreground">{member.name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{member.phone} · Invitation saved</p></div>
                        <a href={`https://wa.me/${member.phone.replace(/\D/g, "")}?text=${encodeURIComponent(inviteMessage)}`} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-bold text-primary hover:bg-primary-soft">WhatsApp</a>
                        <button type="button" onClick={() => void handleRemoveTeamInvite(member.id)} aria-label={`Remove ${member.name}`} className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"><HiOutlineTrash className="h-4 w-4" /></button>
                      </div>;
                    })}
                  </div>
                ) : <p className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">No team contacts added yet.</p>}
                <p className="text-[10px] leading-4 text-muted-foreground">Adding a contact saves their details and prepares a WhatsApp message. Facility workspace access is managed separately.</p>
              </div>

              <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><HiOutlineKey className="h-5 w-5" /></span>
                    <div><h3 className="text-sm font-extrabold text-foreground">Account &amp; sign-in</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{accountUser?.phone || contactPhone}{accountUser?.email ? ` · ${accountUser.email}` : " · Email not linked to sign-in"}</p><p className="mt-1 text-[11px] text-muted-foreground">{accountUser?.passwordConfigured ? "Password sign-in is enabled." : "You currently sign in with a one-time code."}</p></div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(true)} className="h-9 cursor-pointer rounded-xl text-xs font-bold">{accountUser?.passwordConfigured ? "Change password" : "Set password"}</Button>
                    <Button type="button" variant="ghost" onClick={() => void handleFacilitySignOut()} className="h-9 cursor-pointer rounded-xl text-xs font-bold text-muted-foreground">Sign out</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. IN-PROFILE SECTION EDIT MODAL (Exact Candidate Match)                  */}
        {/* ========================================================================= */}
        <Dialog open={Boolean(editSection)} onOpenChange={(open) => !open && setEditSection(null)}>
          <DialogContent className="[&>button:last-of-type]:right-8 [&>button:last-of-type]:top-4 flex max-h-[90dvh] flex-col overflow-hidden rounded-3xl p-0 shadow-2xl sm:max-w-xl">
            <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden rounded-3xl p-5 pb-6 sm:p-6">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground">
                {editSection === "identity" && "Edit Hospital Name & Capacity"}
                {editSection === "about" && "Edit About the Institution"}
                {editSection === "specialties" && "Manage Specialties & Departments"}
                {editSection === "address" && "Edit Campus Address"}
                {editSection === "credentials" && "Edit Institutional Credentials"}
                {editSection === "contact" && "Edit Administrative Contacts"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update institutional records directly inside your verified profile.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Identity & Bed Capacity Form */}
              {editSection === "identity" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Hospital / Institution Name *</label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Apollo Multispecialty Hospital"
                    />
                  </div>

                  <div>
                    <SelectField
                      label="Facility Type"
                      options={[
                        "Multispecialty Hospital",
                        "Super Specialty Hospital",
                        "Tertiary Care Medical Center",
                        "Teaching & Research Hospital",
                        "District General Hospital",
                        "Day Care & Surgical Center",
                      ]}
                      value={facilityType}
                      onChange={setFacilityType}
                      placeholder="Select facility type"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Inpatient Beds</label>
                      <input
                        type="number"
                        value={beds}
                        onChange={(e) => setBeds(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">ICU &amp; Critical Beds</label>
                      <input
                        type="number"
                        value={icuBeds}
                        onChange={(e) => setIcuBeds(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* About Institution Form */}
              {editSection === "about" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Clinical Mission &amp; Overview</label>
                    <textarea
                      rows={6}
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-card p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Describe your healthcare facility, clinical specialties, and emergency care readiness..."
                    />
                  </div>
                </div>
              )}

              {/* Specialties & Departments Form */}
              {editSection === "specialties" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDeptInput}
                      onChange={(e) => setNewDeptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDepartment();
                        }
                      }}
                      placeholder="Add specialty (e.g. Neurology, Oncology)"
                      className="flex-1 h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddDepartment}
                      className="rounded-xl text-xs font-bold h-9 px-3.5 bg-primary text-white hover:bg-primary-hover"
                    >
                      + Add
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Current Departments ({departments.length})</p>
                    <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
                      {departments.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center gap-1 rounded-xl bg-muted border border-border px-2.5 py-1 text-xs font-semibold text-foreground"
                        >
                          <span>{dept}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDepartment(dept)}
                            className="text-muted-foreground hover:text-rose-500 cursor-pointer ml-0.5"
                          >
                            <HiOutlineXMark className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Campus Address Form */}
              {editSection === "address" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Branch name <span className="font-medium text-muted-foreground">(optional)</span></label>
                    <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} maxLength={150} className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Enter branch or campus name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Full campus address *</label>
                    <textarea
                      rows={3}
                      value={addressLine}
                      onChange={(e) => {
                        const nextAddress = e.target.value;
                        setAddressLine(nextAddress);
                        const addressPincode = nextAddress.match(/\b[1-9]\d{5}\b/)?.[0];
                        if (addressPincode) setPincode(addressPincode);
                      }}
                      className="min-h-24 w-full resize-y rounded-xl border border-border bg-card px-3 py-2.5 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Building, street, neighbourhood, city and state"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Include the building, street and neighbourhood.</p>
                      <button type="button" onClick={useCurrentAddress} disabled={locatingAddress} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover disabled:cursor-wait disabled:opacity-60">
                        {locatingAddress ? <HiOutlineArrowPath className="h-3.5 w-3.5 animate-spin" /> : <HiOutlineMapPin className="h-3.5 w-3.5" />}
                        {locatingAddress ? "Finding your location…" : "Use current location"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <SelectField
                      label="Area / city"
                      options={Array.from(new Set([...FACILITY_AREAS, area].filter(Boolean)))}
                      value={area}
                      onChange={(value) => { setArea(value); setCity(value); }}
                      placeholder="Select your area or city"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">State *</label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Postal Code (PIN)</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter 6-digit PIN code"
                    />
                  </div>
                </div>
              )}

              {/* Credentials & Licensing Form */}
              {editSection === "credentials" && (
                <div className="space-y-3.5">
                  <div>
                    <SelectField
                      label="Accreditation Level"
                      options={accreditationOptions}
                      value={accreditationLevel}
                      onChange={setAccreditationLevel}
                      placeholder="Select accreditation level"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Clinical Establishment Act (CEA) License *</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. CEA/TN/2021/0049"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">NABH Reference No.</label>
                      <input
                        type="text"
                        value={nabhNumber}
                        onChange={(e) => setNabhNumber(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. NABH-2022-0492"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">GSTIN Identification</label>
                      <input
                        type="text"
                        value={gst}
                        onChange={(e) => setGst(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="15-character GSTIN"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Form */}
              {editSection === "contact" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Contact Person *</label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Dr. R. Sundaram"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Medical Superintendent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Official Phone *</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+91 99999 33333"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Official Email *</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="hospital.admin@apollo.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://apollohospitals.com"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="mt-6 pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditSection(null)}
                className="rounded-xl text-xs font-bold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={pageAction.isPending || (saving)}
                onClick={handleSaveSection}
                className="rounded-xl text-xs font-bold h-9 px-5 bg-primary text-white hover:bg-primary-hover shadow-xs cursor-pointer"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* 4. REAL UPLOADED DOCUMENT PREVIEW MODAL (Exact Candidate Match)           */}
        {/* ========================================================================= */}
        <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-5 shadow-2xl sm:max-w-md sm:p-6">
            <DialogHeader className="text-left">
              <DialogTitle>{accountUser?.passwordConfigured ? "Change sign-in password" : "Set a sign-in password"}</DialogTitle>
              <DialogDescription className="text-xs leading-5">Use a password of at least 8 characters. You can continue to sign in with a one-time code too.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveFacilityPassword} className="mt-2 space-y-3">
              {accountUser?.passwordConfigured && <div><label className="mb-1 block text-xs font-semibold">Current password</label><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>}
              <div><label className="mb-1 block text-xs font-semibold">New password</label><input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="mb-1 block text-xs font-semibold">Confirm new password</label><input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div className="flex justify-end gap-2 border-t border-border pt-3">
                <Button type="button" variant="outline" onClick={() => setAccountDialogOpen(false)} className="cursor-pointer rounded-xl">Cancel</Button>
                <Button type="submit" disabled={passwordSaving} className="cursor-pointer rounded-xl">{passwordSaving ? "Saving…" : "Save password"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-6">
            <div className="relative flex h-[min(90dvh,760px)] max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl rounded-b-none border-x-0 border-t border-b-0 border-border bg-card shadow-2xl animate-in slide-in-from-bottom duration-300 sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl sm:border sm:zoom-in-95 sm:slide-in-from-bottom-0">
              {/* Modal Header */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 py-3 sm:px-5 sm:py-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                    <HiOutlineDocumentCheck className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm sm:text-base text-foreground truncate">
                      {previewDoc.title}
                    </h3>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">
                      {previewDoc.fileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(previewDoc.url, "_blank")}
                    className="rounded-xl text-xs font-bold gap-1.5 border-border hover:border-primary text-foreground hover:text-primary h-8 px-3 cursor-pointer"
                  >
                    <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Close Preview"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Viewer Body */}
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-muted/40 p-2 sm:overflow-auto sm:p-6">
                {previewDoc.isImage ? (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.fileName}
                    className="max-h-full max-w-full rounded-xl border border-border bg-white object-contain shadow-md sm:rounded-2xl"
                  />
                ) : (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.fileName}
                    className="h-full min-h-0 w-full rounded-lg border border-border bg-white shadow-sm sm:h-[70vh] sm:rounded-2xl"
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-card px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <HiOutlineShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Statutory Compliance Copy</span>
                </span>

                <a
                  href={previewDoc.url}
                  download={previewDoc.fileName}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-primary-hover sm:w-auto sm:py-1.5"
                >
                  <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                  <span>Download Document</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    );
  }
