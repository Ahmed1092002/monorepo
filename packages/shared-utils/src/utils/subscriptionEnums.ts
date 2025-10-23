export const SubscriptionEnums = {
  Excluded: -2,
  Draft: -1,
  Terminated: 0,
  Pending: 1,
  UpToDate: 2,
  Expired: 3,
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionEnums)[keyof typeof SubscriptionEnums];

export default SubscriptionEnums;
