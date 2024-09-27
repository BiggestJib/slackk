"use client";

import { Button } from "@/components/ui/button";
import { useGetWorkspaceInfo } from "@/components/workspaces/api/use-get-workspace-info";
import { useJoin } from "@/components/workspaces/api/use-join";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import VerificationInput from "react-verification-input";
import { toast } from "sonner";

const JoinPage = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useGetWorkspaceInfo({ id: workspaceId });
  const { mutate, isPending } = useJoin();

  const isMember = useMemo(() => data?.isMember, [data?.isMember]);

  useEffect(() => {
    if (isMember) {
      router.push(`/workspace/${workspaceId}`);
      toast.success(`"Welcome! You've joined the ${data?.name} workspace."`);
    }
  }, [isMember, router, workspaceId]);

  const handleComplete = (value: string) => {
    mutate(
      {
        workspaceId,
        joinCode: value,
      },
      {
        onSuccess: (id) => {
          router.replace(`/workspace/${id}`);
          toast.success("Workspace Joined ");
        },
        onError: () => {
          toast.error("Failed to join workspace. Incorrect code");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-purple-700">
        <Loader className="size-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen flex flex-col items-center justify-center bg-[#5E2C5F] p-6">
      <div className="flex flex-col gap-y-8 items-center justify-center bg-white p-8 rounded-lg shadow-lg border border-purple-300 max-w-md w-full">
        <Image alt="Slack Logo" width={60} height={60} src="/slackk.png" />
        <div className="flex flex-col gap-y-4 items-center justify-center max-w-md">
          <div className="flex flex-col gap-y-2 items-center justify-center">
            <h1 className="text-3xl font-bold text-purple-700">
              Join {data?.name} Workspace
            </h1>
            <p className="text-md text-purple-500">
              Enter your unique join code to join the workspace.
            </p>
          </div>
          <VerificationInput
            onComplete={handleComplete}
            length={6}
            classNames={{
              container: cn(
                "flex gap-x-2",
                isPending && "opacity-50 cursor-not-allowed"
              ),
              character:
                "uppercase h-auto rounded-md border border-purple-300 flex items-center justify-center text-lg font-medium text-purple-700",
              characterInactive: "bg-purple-100",
              characterSelected: "bg-white text-purple-700",
              characterFilled: "bg-white text-purple-700",
            }}
            autoFocus
            aria-label="Enter your 6-digit join code"
          />
        </div>
        <div className="flex gap-x-4 w-full">
          <Button
            disabled={isPending}
            size="lg"
            variant="outline"
            className="border-purple-500 text-purple-500 hover:bg-purple-50 w-full"
          >
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
