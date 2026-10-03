import { lazy, type ComponentType, type LazyExoticComponent } from "react"

export type AdminRoute = "master" | "content" | "comments" | "feedback" | "users" | "system"

export interface AdminWorkspaceDefinition {
  id: AdminRoute
  label: string
  permission: string
  component: LazyExoticComponent<ComponentType>
}

export const ADMIN_WORKSPACES: readonly AdminWorkspaceDefinition[] = [
  {
    id: "master",
    label: "Admin Management",
    permission: "admin.manage",
    component: lazy(() => import("./masterAdmin")),
  },
  {
    id: "content",
    label: "Content",
    permission: "content.manage",
    component: lazy(() => import("./contentManager")),
  },
  {
    id: "comments",
    label: "Community",
    permission: "community.moderate",
    component: lazy(() => import("./commentManager")),
  },
  {
    id: "feedback",
    label: "Feedback",
    permission: "feedback.manage",
    component: lazy(() => import("./feedbackManager")),
  },
  {
    id: "users",
    label: "Users",
    permission: "users.manage",
    component: lazy(() => import("./userManager")),
  },
  {
    id: "system",
    label: "System",
    permission: "system.manage",
    component: lazy(() => import("./systemManager")),
  },
]
