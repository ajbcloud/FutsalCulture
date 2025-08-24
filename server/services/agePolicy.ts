import { differenceInYears } from "date-fns";

export type AudienceMode = "adult_only" | "mixed" | "youth_only";

export type PolicyOutcome = {
  parentRequired: boolean;
  showParentSections: boolean;
  teenSelf: boolean;
  whoCanPay: "parent" | "player" | "both";
  guardianConsentNeeded: boolean;
  allowed: {
    book: boolean;
    pay: boolean;
    viewSchedules: boolean;
    manageProfile: boolean;
    inviteOthers: boolean;
    manageDependents: boolean;
  };
};

export function evaluatePolicy(params: {
  dob: Date;
  policy: {
    audienceMode: AudienceMode;
    parentRequiredBelow: number;
    teenSelfAccessAt: number;
    adultAge: number;
    allowTeenPayments: boolean;
  };
}): PolicyOutcome {
  const { dob, policy } = params;
  const age = differenceInYears(new Date(), dob);

  // Adult-only mode: No parent involvement needed
  if (policy.audienceMode === "adult_only") {
    return {
      parentRequired: false,
      showParentSections: false,
      teenSelf: false,
      whoCanPay: "player",
      guardianConsentNeeded: false,
      allowed: {
        book: true,
        pay: true,
        viewSchedules: true,
        manageProfile: true,
        inviteOthers: true,
        manageDependents: false,
      },
    };
  }

  // Youth-only mode: Always require parent involvement for minors
  if (policy.audienceMode === "youth_only") {
    const isAdult = age >= policy.adultAge;
    
    if (isAdult) {
      // Adults can manage their dependents in youth-only mode
      return {
        parentRequired: false,
        showParentSections: true,
        teenSelf: false,
        whoCanPay: "player",
        guardianConsentNeeded: false,
        allowed: {
          book: true,
          pay: true,
          viewSchedules: true,
          manageProfile: true,
          inviteOthers: true,
          manageDependents: true,
        },
      };
    }
    
    // Minors in youth-only mode
    const parentRequired = age < policy.parentRequiredBelow;
    const teenSelf = age >= policy.teenSelfAccessAt && age < policy.adultAge;
    
    return {
      parentRequired,
      showParentSections: parentRequired,
      teenSelf,
      whoCanPay: parentRequired ? "parent" : teenSelf && policy.allowTeenPayments ? "player" : "parent",
      guardianConsentNeeded: true,
      allowed: {
        book: !parentRequired,
        pay: teenSelf && policy.allowTeenPayments,
        viewSchedules: true,
        manageProfile: !parentRequired,
        inviteOthers: false,
        manageDependents: false,
      },
    };
  }

  // Mixed mode: Support both adults and youth
  const parentRequired = age < policy.parentRequiredBelow;
  const teenSelf = age >= policy.teenSelfAccessAt && age < policy.adultAge;
  const isAdult = age >= policy.adultAge;

  let whoCanPay: "parent" | "player" | "both";
  if (parentRequired) {
    whoCanPay = "parent";
  } else if (isAdult) {
    whoCanPay = "player";
  } else if (teenSelf && policy.allowTeenPayments) {
    whoCanPay = "player";
  } else {
    whoCanPay = "parent";
  }

  const guardianConsentNeeded = parentRequired || teenSelf;

  return {
    parentRequired,
    showParentSections: parentRequired || (!isAdult && !teenSelf),
    teenSelf,
    whoCanPay,
    guardianConsentNeeded,
    allowed: {
      book: !parentRequired,
      pay: isAdult || (teenSelf && policy.allowTeenPayments),
      viewSchedules: true,
      manageProfile: !parentRequired,
      inviteOthers: isAdult,
      manageDependents: isAdult,
    },
  };
}

export function computeAgeBand(age: number, policy: { teenSelfAccessAt: number; adultAge: number }): "child" | "teen" | "adult" {
  if (age >= policy.adultAge) return "adult";
  if (age >= policy.teenSelfAccessAt) return "teen";
  return "child";
}