import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface EmojiPopoverProps {
  children: React.ReactNode;
  hint?: string;
  onEmojiSelect: (emoji: any) => void;
}

export const EmojiPopOver = ({
  children,
  hint = "Emoji",
  onEmojiSelect,
}: EmojiPopoverProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    // Initial check
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleEmojiSelect = (emoji: any) => {
    onEmojiSelect(emoji.native);
    setPopoverOpen(false); // Close popover after emoji selection

    setTimeout(() => {
      setTooltipOpen(false);
    }, 500);
  };

  return (
    <TooltipProvider>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Tooltip
          open={tooltipOpen}
          onOpenChange={setTooltipOpen}
          delayDuration={50}
        >
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent className="bg-black text-white border border-white/5">
            <p className="text-medium text-xs">{hint}</p>
          </TooltipContent>
        </Tooltip>

        {/* Single PopoverContent with responsive behavior */}
        <PopoverContent className="p-0 w-full max-w-xs sm:max-w-sm lg:max-w-md border-none shadow-none">
          <div className="emoji-picker-container">
            <Picker
              data={data}
              title="Select an emoji"
              emoji="point_up"
              onEmojiSelect={handleEmojiSelect}
              // Dynamically adjust perLine based on screen size
              perLine={isLargeScreen ? 10 : 7} // More emojis on large screens
            />
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
