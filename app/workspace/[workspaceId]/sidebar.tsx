import { UserButton } from "@/components/user-button";
import React from "react";
import WorkspaceSwitcher from "./workspace-switcher";
import SidebarButton from "./sidebar-button";
import { BellIcon, Home, MessageSquare, MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";

const SideBar = () => {
  const pathname = usePathname();
  return (
    <aside className="w-[70px] h-full bg-[#481349] flex flex-col gap-y-4 items-center pt-[9px] pb-4">
      <nav className="flex flex-col gap-y-4 items-center w-full">
        <WorkspaceSwitcher />
        <SidebarButton
          icon={Home}
          label="Home"
          isActive={pathname.includes("/workspace")}
        />
        <SidebarButton icon={MessageSquare} label="Dms" />
        <SidebarButton icon={BellIcon} label="Activity" />
        <SidebarButton icon={MoreHorizontal} label="More" />
      </nav>

      <div className="flex-col flex items-center justify-center gap-y-1 mt-auto">
        <UserButton />
      </div>
    </aside>
  );
};

export default SideBar;
