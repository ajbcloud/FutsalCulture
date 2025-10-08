export function getTerminologyLabels(audienceMode: string) {
  if (audienceMode === "youth_only") {
    return {
      adultColumnLabel: "Parent" as const,
      adult1: "Parent 1",
      adult2: "Parent 2",
      guardianTerm: "Parent" as const,
      showGuardianColumns: true
    };
  } else if (audienceMode === "adult_only") {
    return {
      adultColumnLabel: null,
      adult1: null,
      adult2: null,
      guardianTerm: null,
      showGuardianColumns: false
    };
  } else { // mixed
    return {
      adultColumnLabel: "Guardian" as const,
      adult1: "Guardian 1",
      adult2: "Guardian 2",
      guardianTerm: "Guardian" as const,
      showGuardianColumns: true
    };
  }
}
