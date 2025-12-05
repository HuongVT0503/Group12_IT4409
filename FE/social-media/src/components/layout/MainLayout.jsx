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
      <div className="flex justify-center max-w-[1440px] mx-auto pt-16 lg:pt-20">
        
        {/* LEFT COLUMN: Sidebar (Desktop only) */}
        {/* Hidden on mobile (hidden), visible on lg screens (lg:block) */}
        <aside className="hidden lg:block w-[280px] fixed left-0 top-20 h-[calc(100vh-80px)] pl-6 xl:pl-10 overflow-y-auto no-scrollbar">
          <SideBar />
        </aside>

        {/* MIDDLE COLUMN: Dynamic Content (The Feed) */}
        {/* On mobile: takes full width. On desktop: centered with margin for sidebars */}
        <main className="w-full lg:w-[600px] xl:w-[640px] px-0 sm:px-4 pb-20 lg:pb-8 lg:ml-[280px] xl:ml-0">
          <Outlet />
        </main>

        {/* RIGHT COLUMN: Widgets (Large Desktop only) */}
        {/* Hidden on small/medium screens, visible on xl screens */}
        <aside className="hidden xl:block w-[320px] fixed right-0 top-20 h-[calc(100vh-80px)] pr-10 overflow-y-auto no-scrollbar">
          <RightPanel />
        </aside>

      </div>

      {/* 3. BOTTOM NAVIGATION (Mobile only) */}
      <BottomNav />
    </div>
  );
}