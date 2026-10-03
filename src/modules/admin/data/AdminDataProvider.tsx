import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react"

import { isSupabaseConfigured, supabase } from "../../../lib/supabase"
import type {
  AdminEntity,
  AdminRepository,
  AdminResourceName,
} from "./contracts"
import type { AdminDataServices } from "./repositories"
import { createSupabaseAdminDataServices } from "./supabaseAdminRepository"

export interface AdminDataContextValue {
  services: AdminDataServices
  mode: "supabase" | "unconfigured"
  isSupabaseConfigured: boolean
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

export function AdminDataProvider({ children }: PropsWithChildren) {
  const value = useMemo<AdminDataContextValue>(
    () => ({
      services: createSupabaseAdminDataServices(supabase),
      mode: isSupabaseConfigured ? "supabase" : "unconfigured",
      isSupabaseConfigured,
    }),
    [],
  )

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  )
}

export function useAdminData(): AdminDataContextValue {
  const context = useContext(AdminDataContext)
  if (!context) {
    throw new Error("useAdminData must be used inside AdminDataProvider")
  }
  return context
}

export function useAdminRepository<T extends AdminEntity>(
  resource: AdminResourceName,
): AdminRepository<T> {
  const { services } = useAdminData()
  return useMemo(() => services.repository<T>(resource), [resource, services])
}
