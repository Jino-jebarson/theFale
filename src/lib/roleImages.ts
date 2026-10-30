import doctorImg from "@/assets/roles/role-doctor.jpg";
import nurseImg from "@/assets/roles/role-nurse.jpg";
import pharmacistImg from "@/assets/roles/role-pharmacist.jpg";
import physioImg from "@/assets/roles/role-physiotherapist.jpg";
import technicianImg from "@/assets/roles/role-technician.jpg";

export const roleImages: Record<string, string> = {
  doctor: doctorImg,
  nurse: nurseImg,
  pharmacist: pharmacistImg,
  physiotherapist: physioImg,
  technician: technicianImg,
};

/**
 * Returns dynamic 3D illustration based on candidate's onboarded role
 */
export function getRoleIllustration(role?: string): string {
  if (!role) return pharmacistImg;

  const r = role.toLowerCase().trim();

  // Doctor / Physician / Surgeon
  if (
    r.includes("doctor") ||
    r.includes("physician") ||
    r.includes("surgeon") ||
    r.includes("consultant") ||
    r.includes("medical officer") ||
    r.includes("resident") ||
    r.includes("mbbs") ||
    r.includes("specialist")
  ) {
    return doctorImg;
  }

  // Nurse / Nursing
  if (
    r.includes("nurse") ||
    r.includes("nursing") ||
    r.includes("midwife") ||
    r.includes("matron") ||
    r.includes("sister")
  ) {
    return nurseImg;
  }

  // Pharmacist
  if (
    r.includes("pharmacist") ||
    r.includes("pharmacy") ||
    r.includes("pharm") ||
    r.includes("druggist") ||
    r.includes("dispenser")
  ) {
    return pharmacistImg;
  }

  // Physiotherapist / Rehab
  if (
    r.includes("physio") ||
    r.includes("physical therapist") ||
    r.includes("rehab") ||
    r.includes("kinesio")
  ) {
    return physioImg;
  }

  // Lab, Radiography, Dialysis, OT, Diagnostics, Paramedics
  if (
    r.includes("technician") ||
    r.includes("lab") ||
    r.includes("radiograph") ||
    r.includes("dialysis") ||
    r.includes("ot") ||
    r.includes("paramedic") ||
    r.includes("phlebotomist") ||
    r.includes("respiratory") ||
    r.includes("optometrist") ||
    r.includes("audiologist") ||
    r.includes("coder") ||
    r.includes("therapist") ||
    r.includes("dietitian")
  ) {
    return technicianImg;
  }

  // Default to Pharmacist or Doctor
  return pharmacistImg;
}
