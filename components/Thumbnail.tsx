import React, { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "./ui/dialog";
import { X } from "lucide-react";

interface ThumbnailProps {
  url: string | null | undefined;
}

export const Thumbnail = ({ url }: ThumbnailProps) => {
  const closeButtonRef = useRef<HTMLDivElement>(null); // Ref for the DialogClose button
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Track dialog open state

  useEffect(() => {
    // Force focus on the close button when the dialog opens
    if (isDialogOpen && closeButtonRef.current) {
      closeButtonRef.current.focus(); // Explicitly focus the close button
    }
  }, [isDialogOpen]); // Runs when the dialog open state changes

  if (!url) return null;

  return (
    <Dialog onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className="relative overflow-hidden max-w-[360px] border rounded-lg my-2 cursor-zoom-in hover:shadow-lg transition-shadow duration-200">
          <img
            src={url}
            alt="Thumbnail preview"
            loading="lazy"
            className="rounded-md object-cover w-full h-full"
          />
        </div>
      </DialogTrigger>
      <DialogContent
        autoFocus={false}
        className="max-w-[800px] bg-black/70 p-0 shadow-none flex justify-center items-center"
      >
        <DialogClose asChild>
          {/* Add ref to the close button for focusing */}
          <div
            ref={closeButtonRef}
            role="button" // Make it accessible as a button
            tabIndex={0} // Ensure it's focusable and navigable
            className="absolute font-bold bg-gray-800 p-2 hover:bg-gray-800/50 rounded-md  top-1 right-1 cursor-pointer text-base  text-white"
          >
            <X className="w-6 h-6" />
          </div>
        </DialogClose>
        <img
          src={url}
          alt="Enlarged image preview"
          className="rounded-md focus:ring-black object-cover w-full max-h-[90vh]"
        />
      </DialogContent>
    </Dialog>
  );
};
