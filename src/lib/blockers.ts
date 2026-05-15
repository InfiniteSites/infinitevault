export const BLOCKERS = [
  "FortiGuard",
  "Lightspeed",
  "Palo Alto",
  "Blocksi Web",
  "Blocksi AI",
  "Linewize",
  "Cisco Umbrella",
  "Securly",
  "GoGuardian",
  "LanSchool",
  "ContentKeeper",
  "AristotleK12",
  "Senso Cloud",
  "Deledao",
  "iBoss",
  "Sophos",
  "Barracuda",
  "Qustodio",
  "DNSFilter",
  "ZScaler",
] as const;

export type Blocker = typeof BLOCKERS[number];
