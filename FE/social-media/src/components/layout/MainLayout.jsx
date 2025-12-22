//master wrapper
//both mobile and desktop

import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import SideBar from "./SideBar";
//import RightPanel from "./RightPanel";
import BottomNav from "./BottomNav";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-bg-main text-gray-900 font-sans">
      <TopBar />

      {/*MAIN*/}
      <div className="flex justify-center w-full mx-auto pt-16 lg:pt-20">
        {/* LEFT:Desktop only*/}
        {/* Hidden on mobile, visible on lg screens*/}
        <aside className="hidden lg:block w-[280px] fixed left-0 top-20 h-[calc(100vh-80px)] z-100 overflow-y-auto no-scrollbar">
          <SideBar />
        </aside>

        {/* MIDDLE*/}
        {/* On mobile: takes full width. On desktop: centered with margin for sidebars */}
        <main className="w-full lg:pl-[280px]">
          <Outlet />
        </main>

        {/* RIGHT:Desktop only*/}
      </div>

      {/* (Mobile only) */}
      <BottomNav />
    </div>
  );
}
