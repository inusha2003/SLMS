import { Outlet } from "react-router-dom";
import AiContentSidebar from "../AiContentSidebar.jsx";

export default function AiWorkspaceLayout() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] overflow-hidden bg-[#07111d] text-slate-100">
      <AiContentSidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}