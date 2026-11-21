export interface CandidateProfileStrengthInput {
  name?: string | null;
  city?: string | null;
  email?: string | null;
  profession?: string | null;
  specialty?: string | null;
  qualification?: string | null;
  college?: string | null;
  skills?: unknown[] | null;
  languages?: unknown[] | null;
  experienceHistory?: unknown[] | null;
  preferredCities?: unknown[] | null;
  employmentType?: string | null;
  availability?: string | null;
  bio?: string | null;
  isStudent?: boolean;
  isFresher?: boolean;
}

/** Keep the profile page and global avatar completion indicators in sync. */
export function calculateCandidateProfileStrength(profile: CandidateProfileStrengthInput): number {
  const isStudent = Boolean(profile.isStudent);
  const isFresher = Boolean(profile.isFresher);
  const strengthSignals = [
    Boolean(profile.name?.trim() && profile.name !== "Clinician" && profile.city?.trim()),
    Boolean(profile.email?.trim()),
    Boolean(profile.profession?.trim() && profile.profession !== "Clinician" && profile.specialty?.trim() && profile.specialty !== "Not provided"),
    Boolean(profile.qualification?.trim() && profile.college?.trim()),
    Boolean(profile.skills?.length),
    Boolean(profile.languages?.length),
    ...(!isStudent && !isFresher ? [Boolean(profile.experienceHistory?.length)] : []),
    Boolean(profile.preferredCities?.length && profile.employmentType?.trim() && profile.availability?.trim()),
    Boolean(profile.bio?.trim()),
  ];
  return Math.round((strengthSignals.filter(Boolean).length / strengthSignals.length) * 100);
}
