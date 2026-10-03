import type {
  AdminActionRequest,
  AdminActionResult,
  AdminEntity,
  AdminLoginInput,
  AdminRepository,
  AdminResourceName,
  AdminSession,
} from "./contracts"

export interface AdminDataServices {
  repository<T extends AdminEntity>(
    resource: AdminResourceName,
  ): AdminRepository<T>
  action<TPayload = unknown, TResult = unknown>(
    resource: AdminResourceName,
    id: string,
    request: AdminActionRequest<TPayload>,
  ): Promise<AdminActionResult<TResult>>
  login(input: AdminLoginInput): Promise<AdminSession>
  logout(): Promise<void>
  session(signal?: AbortSignal): Promise<AdminSession>
}
