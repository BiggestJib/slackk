// Import necessary hooks and components
import { useState } from "react"; // React hook to manage state

import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"; // Custom dialog components
import { Button } from "@/components/ui/button"; // Custom button component

// Custom hook `useConfirm` that returns a confirmation dialog and a promise-based confirm function
export const useConfirm = (
  title: string, // Title of the dialog
  message: string // Message to display in the dialog
): [() => JSX.Element, () => Promise<unknown>] => {
  // State to manage the promise that will resolve when the user confirms or cancels
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  // Function to trigger the confirmation dialog and return a promise
  const confirm = () =>
    new Promise<boolean>((resolve) => {
      setPromise({ resolve }); // Set the promise state with the resolve function
    });

  // Function to handle closing the dialog
  const handleClose = () => {
    setPromise(null); // Reset the promise state to null to close the dialog
  };

  // Function to handle canceling the confirmation
  const handleCancel = () => {
    promise?.resolve(false); // Resolve the promise with `false` (user canceled)
    handleClose(); // Close the dialog
  };

  // Function to handle confirming the action
  const handleConfirm = () => {
    promise?.resolve(true); // Resolve the promise with `true` (user confirmed)
    handleClose(); // Close the dialog
  };

  // The confirmation dialog component
  const ConfirmDialog = () => (
    <Dialog open={promise !== null} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>{" "}
          {/* Display the title passed to `useConfirm` */}
          <DialogDescription>{message}</DialogDescription>{" "}
          {/* Display the message passed to `useConfirm` */}
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel {/* Button to cancel and resolve the promise with `false` */}
          </Button>
          <Button onClick={handleConfirm}>
            Confirm{" "}
            {/* Button to confirm and resolve the promise with `true` */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Return the dialog component and the `confirm` function to trigger it
  return [ConfirmDialog, confirm];
};
