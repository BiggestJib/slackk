import { useParentMessageId } from "@/components/messages/store/use-parent-message-id";
import { useProfileMemberId } from "@/components/members/store/use-profile-member-id";

export const usePanel = () => {
  // State and setter functions from hooks for parentMessageId and profileMemberId
  const [parentMessageId, setParentMessageId] = useParentMessageId();
  const [profileMemberId, setProfileMemberId] = useProfileMemberId();

  // `onOpenMessage` opens a message thread by setting the memberId and clearing the profile
  const onOpenMessage = (messageId: string) => {
    setParentMessageId(messageId); // Open the message thread
    setProfileMemberId(null); // Ensure profile view is closed
  };

  // `onOpenProfile` opens a profile by setting the memberId and clearing the message thread
  const onOpenProfile = (memberId: string) => {
    setProfileMemberId(memberId); // Open the profile
    setParentMessageId(null); // Ensure message thread view is closed
  };

  // `onClose` closes both the message thread and the profile view
  const onClose = () => {
    setParentMessageId(null);
    setProfileMemberId(null);
  };

  // Return functions and state values for panel management
  return {
    onOpenMessage,
    onOpenProfile,
    onClose,
    parentMessageId,
    profileMemberId,
  };
};
