//master wrapper
//both mobile and desktop

import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import SideBar from "./SideBar";
import RightPanel from "./RightPanel";
import BottomNav from "./BottomNav";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-bg-main text-gray-900 font-sans">
      {/* 1. FIXED TOP BAR (Desktop & Mobile) */}
      <TopBar />

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="w-full max-w-[1920px] mx-auto pt-16 lg:pt-20 px-0 sm:px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_350px] 2xl:grid-cols-[350px_1fr_400px] gap-6 2xl:gap-10 align-start h-full">
        
          {/* LEFT COLUMN: Sidebar (Desktop only) */}
          {/* Hidden on mobile (hidden), visible on lg screens (lg:block) */}
          <aside className="hidden lg:block sticky top-24 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
            <SideBar />
          </aside>
          {/* MIDDLE COLUMN: Dynamic Content (The Feed) */}
          {/* On mobile: takes full width. On desktop: centered with margin for sidebars */}
          <main className="w-full min-w-0 pb-20 lg:pb-8">
            <Outlet />
          </main>
          {/* RIGHT COLUMN: Widgets (Large Desktop only) */}
          {/* Hidden on small/medium screens, visible on xl screens */}
          <aside className="hidden xl:block sticky top-24 h-[calc(100vh-100px)] overflow-y-auto no-scrollbar">
            <RightPanel />
          </aside>
        </div>
      </div>

      {/* 3. BOTTOM NAVIGATION (Mobile only) */}
      <BottomNav />
    </div>
  );
}
