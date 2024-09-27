"use client";
import React, { useState, useEffect } from "react";
import Toolbar from "./toolbar";
import SideBar from "./sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import WorkspaceSidebar from "./workspace-sidebar";
import { Loader, Menu, X } from "lucide-react"; // For the menu and close icons
import { Hint } from "@/components/hint";
import { usePanel } from "@/hooks/use-panel";
import { Id } from "@/convex/_generated/dataModel";
import { Thread } from "@/components/messages/components/Thread";
import { cn } from "@/lib/utils";
import { Profile } from "@/components/members/components/Profile";

interface WorkspaceIdLayoutProps {
  children: React.ReactNode;
}

const WorkspaceIdLayout = ({ children }: WorkspaceIdLayoutProps) => {
  const { parentMessageId, profileMemberId, onClose } = usePanel();
  const showPanel = !!parentMessageId || !!profileMemberId;

  // State to toggle sidebar visibility on small screens
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State to manage thread panel visibility
  const [isThreadOpen, setIsThreadOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Effect to manage when the thread panel should open based on onOpenMessage
  useEffect(() => {
    setIsThreadOpen(!!parentMessageId || !!profileMemberId);
  }, [parentMessageId, profileMemberId]);

  return (
    <div className="h-full relative">
      <Toolbar />

      <div className="flex h-[calc(100vh-40px)] overflow-y-auto">
        <SideBar />

        <ResizablePanelGroup
          autoSaveId="workspace-layout"
          direction="horizontal"
          className="flex-1"
        >
          {/* Menu button for small screens */}
          {!isSidebarOpen && (
            <Hint side="bottom" label="Open Channels">
              <button
                onClick={toggleSidebar}
                className={cn(
                  "lg:hidden hover:bg-gray-800/50 absolute top-8 left-16 z-50 bg-gray-800 text-white p-2 rounded-md transition-all duration-300",
                  isThreadOpen && "bg-gray-800/7"
                )}
                aria-label="Open channels sidebar"
                aria-expanded={isSidebarOpen}
                aria-controls="channels-sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
            </Hint>
          )}

          {/* Sidebar for large screens and toggle for small screens */}
          <ResizablePanel
            defaultSize={20} // Default size set to avoid layout shift
            minSize={11}
            className={`bg-[#5E2C5F] lg:block ${
              isSidebarOpen ? "block" : "hidden"
            } fixed lg:static top-[calc(2.5rem + 10px)] left-30 z-40 h-full w-[400px] lg:w-auto transition-transform duration-300 ease-in-out shadow-lg`}
            id="channels-sidebar"
          >
            <WorkspaceSidebar closeSidebar={closeSidebar} />
            {/* Close button for small screens */}
            <Hint side="bottom" label="Close Channels">
              <button
                onClick={toggleSidebar}
                className="lg:hidden absolute top-0 left-0 text-white bg-gray-800 p-2 hover:bg-gray-800/50 rounded-md"
                aria-label="Close channels sidebar"
                aria-expanded={!isSidebarOpen}
              >
                <X className="w-6 h-6" />
              </button>
            </Hint>
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="border-4 hidden lg:block transition-colors duration-150"
          />

          <ResizablePanel
            defaultSize={70} // Set a default size for the main content area
            minSize={20}
            className="lg:ml-0 flex-1"
          >
            {children}
          </ResizablePanel>

          {/* Thread Panel */}
          {showPanel && isThreadOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                minSize={20}
                defaultSize={29} // Set default size to avoid layout shift for thread panel
                className={`fixed lg:static lg:mt-0 mt-10 top-0 right-0 z-40 h-full w-[400px] lg:w-auto bg-white shadow-lg transition-transform duration-300 ease-in-out`}
              >
                {parentMessageId ? (
                  <Thread
                    onClose={onClose}
                    messageId={parentMessageId as Id<"messages">}
                  />
                ) : profileMemberId ? (
                  <Profile
                    memberId={profileMemberId as Id<"members">}
                    onClose={onClose}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Shared overlay for sidebar and thread panel */}
      {(isSidebarOpen || isThreadOpen) && (
        <div
          onClick={() => {
            if (isSidebarOpen) closeSidebar();
            if (isThreadOpen) {
              setIsThreadOpen(false);
              onClose();
            }
          }}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300"
        />
      )}
    </div>
  );
};

export default WorkspaceIdLayout;
