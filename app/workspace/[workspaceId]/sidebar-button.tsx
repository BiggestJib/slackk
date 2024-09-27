import React from "react";
import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons/lib";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarButtonProps {
  icon: LucideIcon | IconType;
  label: string;
  isActive?: boolean;
}

const SidebarButton = ({ icon: Icon, label, isActive }: SidebarButtonProps) => {
  return (
    <div
      role="button"
      aria-label={label}
      className="flex flex-col items-center justify-center gap-y-1 cursor-pointer group"
    >
      <Button
        variant="transparent"
        className={cn(
          "size-9 p-2 group-hover:bg-accent/20 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
          isActive && "bg-accent/20"
        )}
      >
        <Icon className="size-5 text-white group-hover:scale-110 transition-all duration-200 ease-in-out" />
      </Button>
      <span className="text-[11px] text-white group-hover:text-accent transition-colors duration-200 ease-in-out">
        {label}
      </span>
    </div>
  );
};

export default SidebarButton;
