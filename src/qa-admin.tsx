import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import "./modules/admin/admin.css"
import { AdminDataProvider } from "./modules/admin/data"
import AdminManagement from "./modules/admin/masterAdmin/pages/AdminManagement"
import ContentManagerView from "./modules/admin/contentManager/ContentManagerView"
import CommentManagerView from "./modules/admin/commentManager/CommentManagerView"
import FeedbackManagerView from "./modules/admin/feedbackManager/FeedbackManagerView"
import UserManagerView from "./modules/admin/userManager/UserManagerView"
import SystemManagerView from "./modules/admin/systemManager/SystemManagerView"

const views = {
  master: AdminManagement,
  content: ContentManagerView,
  community: CommentManagerView,
  feedback: FeedbackManagerView,
  users: UserManagerView,
  system: SystemManagerView,
} as const

const requested = new URLSearchParams(window.location.search).get("page")
const page = requested && requested in views ? (requested as keyof typeof views) : "master"
const Workspace = views[page]

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminDataProvider>
      <div className="manager-module admin-shell" style={{ display: "block" }}>
        <main className="admin-workspace-content" style={{ paddingTop: 0 }}>
          <Workspace />
        </main>
      </div>
    </AdminDataProvider>
  </StrictMode>,
)
