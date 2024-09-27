import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useCreateMessage } from "@/components/messages/api/use-create-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useChannelId } from "@/hooks/use-channel-id";
import { toast } from "sonner";
import { useGenerateUploadUrl } from "@/components/upload/use-generate-upload-url";
import { Id } from "@/convex/_generated/dataModel";
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface ChatInputProps {
  placeholder: string;
}

type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  body: string;
  image?: Id<"_storage"> | undefined;
};

const ChatInput = ({ placeholder }: ChatInputProps) => {
  const [editorKey, setEditorKey] = useState(0);
  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();
  const [isPending, setIsPending] = useState(false);
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { mutate: createMessage } = useCreateMessage();
  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string; // The body of the message (text content)
    image: File | null; // Optional image file to upload (can be null)
  }) => {
    try {
      setIsPending(true); // Set a loading state to indicate the process is ongoing
      editorRef?.current?.enable(false); // Disable the editor to prevent further input while submitting

      // Create an object with initial message data
      const values: CreateMessageValues = {
        channelId, // ID of the channel where the message is being sent
        workspaceId, // ID of the workspace to which the channel belongs
        body, // Text content of the message
        image: undefined, // Initialize image as undefined; will be updated if an image is provided
      };

      // If an image is provided, handle the image upload
      if (image) {
        // Request an upload URL from the server (used to upload the image to a storage system)
        const url = await generateUploadUrl({}, { throwError: true });

        // If no upload URL is returned, throw an error
        if (!url) {
          throw new Error(`Upload Failed`);
        }

        // Perform the actual image upload using the provided URL
        const result = await fetch(url, {
          method: "POST", // Use POST to upload the image file
          headers: { "Content-Type": image.type }, // Set the content type to match the image file
          body: image, // Send the image as the request body
        });

        // If the upload fails, throw an error
        if (!result.ok) {
          throw new Error("Failed to upload image");
        }

        // Parse the response to get the image's storage ID
        const { storageId } = await result.json();

        // Update the message values object to include the uploaded image's storage ID
        values.image = storageId;
      }

      // Send the message data to the server
      await createMessage(values, { throwError: true });

      // Reset the editor's key to force a re-render, effectively clearing the editor
      setEditorKey((prevKey) => prevKey + 1);
    } catch (error) {
      // Show an error notification in case of failure
      toast.error("Failed to send Message" || error);
    } finally {
      // Reset the loading state and re-enable the editor for further input
      setIsPending(false);
      editorRef?.current?.enable(true);
    }
  };

  const editorRef = useRef<Quill | null>(null);
  return (
    <div className="px-5 w-full">
      <Editor
        key={editorKey}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        innerRef={editorRef}
        disabled={isPending}
      />
    </div>
  );
};

export default ChatInput;
