export function getMemberDestination(
  hasActiveSubscription: unknown,
): "subscription" | "profileSelect" {
  return hasActiveSubscription === true ? "profileSelect" : "subscription"
}
