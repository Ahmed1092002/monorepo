export const SubscriptionEnums = {
  Draft: 0,
  UpToDate: 1,
  Pending: 2,
  Excluded: 3,
  Terminated: 4,
  Expired: 5,
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionEnums)[keyof typeof SubscriptionEnums];

export default SubscriptionEnums;
