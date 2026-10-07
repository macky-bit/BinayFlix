import { supabase } from "./supabase"
import { getMemberDestination } from "./authRouting"

export type SignedInDestination = "admin" | "subscription" | "profileSelect"

export async function getSignedInDestination(): Promise<SignedInDestination> {
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
  if (subscriptionError) throw subscriptionError

  return getMemberDestination(
    storedSubscription && typeof storedSubscription === "object"
      ? (storedSubscription as { is_active?: unknown }).is_active
      : false,
  )
}
