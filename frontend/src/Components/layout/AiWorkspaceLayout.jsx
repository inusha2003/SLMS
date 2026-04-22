import { Outlet } from "react-router-dom";
import AiContentSidebar from "../AiContentSidebar.jsx";
import "../../styles/ai-tools.css";
import { useTheme } from "../../context/MThemeContext.jsx";

export default function AiWorkspaceLayout() {
  const { dark } = useTheme();
  return (
    <div
      className={[
        "flex h-[calc(100vh-4rem)] overflow-hidden",
        dark ? "theme-dark bg-[#07111d] text-slate-100" : "theme-light bg-slate-100 text-slate-900",
      ].join(" ")}
    >
      <AiContentSidebar />
      <main className="ml-[252px] min-w-0 flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
    </div>
  );
}