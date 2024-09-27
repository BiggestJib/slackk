"use client"; // Ensures the component runs on the client-side

import { useState } from "react"; // Import useState for managing the open state
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Loader, LogOut } from "lucide-react"; // Icon library
import { useAuthActions } from "@convex-dev/auth/react";

export const UserButton = () => {
  const { signOut } = useAuthActions();
  const { data, isLoading } = useCurrentUser();
  const [open, setOpen] = useState(false); // State to track dropdown open/close

  // Display a loading spinner while data is being fetched.
  if (isLoading)
    return <Loader className="h-5 w-5 animate-spin text-muted-foreground" />;

  // If no user data is available (e.g., user not logged in), return nothing.
  if (!data) {
    return null;
  }

  // Destructure name, image, and email from the user data.
  const { name, image, email } = data;

  // Fallback avatar letter: use the first letter of the user's name (uppercase).
  const avatarFallback = name ? name.charAt(0).toUpperCase() : "U";

  return (
    <DropdownMenu
      open={open} // Control the open state with `open` prop
      onOpenChange={setOpen} // Update the state when the dropdown opens/closes
      modal={false}
    >
      <DropdownMenuTrigger
        className="outline-none relative  flex items-center p-2 rounded-full hover:opacity-50 transition"
        onMouseEnter={() => setOpen(true)} // Open the dropdown on hover
        onMouseLeave={() => setOpen(false)} // Close the dropdown when mouse leaves
      >
        {/* Avatar component showing the user's image or fallback letter */}
        <Avatar className="w-10 h-10">
          <AvatarImage
            className="w-full h-full rounded-md"
            alt={name || "User Avatar"}
            src={image}
          />
          <AvatarFallback className="text-white rounded-md bg-blue-500 font-semibold flex items-center justify-center w-full h-full ">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      {/* Dropdown menu with user options */}
      <DropdownMenuContent
        align="center"
        side="right"
        className="rounded-lg shadow-lg z-50 bg-white p-2 border border-gray-200"
        onMouseEnter={() => setOpen(true)} // Keep the dropdown open if hovered
        onMouseLeave={() => setOpen(false)} // Close when mouse leaves the menu
      >
        <DropdownMenuLabel className="font-medium text-sm">
          <div className="text-gray-900">Signed in as</div>
          <div className="text-sm text-gray-500">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="border-t" />

        {/* User options */}
        <DropdownMenuItem
          onClick={() => signOut()}
          className="h-10 cursor-pointer flex outline-none hover:outline-none hover:border-none items-center justify-between rounded-lg -mx-2 px-2 hover:bg-gray-300 transition"
        >
          <LogOut className="w-4 h-4 text-gray-500" />
          <span className="text-gray-700 font-medium">Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
