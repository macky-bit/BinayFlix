import { supabase } from "./supabase"

export type SignedInDestination = "admin" | "subscription" | "dashboard"

export async function getSignedInDestination(
  authUserId: string,
): Promise<SignedInDestination> {
  const { data: access } = await supabase.rpc("get_my_admin_access")
  if (
    access &&
    typeof access === "object" &&
    String((access as { status?: unknown }).status).toLowerCase() === "active"
  ) {
    return "admin"
  }

  const { data: subscriptionState, error: subscriptionError } = await supabase
    .rpc("get_my_subscription_state")

  const storedSubscription = Array.isArray(subscriptionState)
    ? subscriptionState[0]
    : subscriptionState
  if (
    !subscriptionError &&
    storedSubscription &&
    typeof storedSubscription === "object" &&
    (storedSubscription as { subscription_id?: unknown }).subscription_id != null
  ) {
    return "dashboard"
  }

  const { data: account, error } = await supabase
    .from("user")
    .select("subscription_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle()

  if (error) throw error
  return account?.subscription_id ? "dashboard" : "subscription"
}
