import React from "react";
import Quill from "quill";
import { useEffect, useRef, useState } from "react";

interface RendererProps {
  value: string;
}

const Renderer = ({ value }: RendererProps) => {
  const [isEmpty, setIsEmpty] = useState(false);
  const rendererRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!rendererRef.current) return; // Check if rendererRef.current exists

    const container = rendererRef.current; // Assign container correctly
    const quill = new Quill(document.createElement("div"), {
      theme: "snow",
    });

    quill.enable(false); // Disable editing
    const contents = JSON.parse(value); // Parse the `value` into quill contents
    quill.setContents(contents); // Set the content for Quill editor

    // Check if the Quill editor is empty
    const isEmpty =
      quill
        .getText()
        .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
        .trim().length === 0; // Check if the resulting string is empty

    setIsEmpty(isEmpty); // Update the state if empty
    container.innerHTML = quill.root.innerHTML; // Set innerHTML of the container

    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = ""; // Properly clear container content
      }
    };
  }, [value]); // Dependency on `value`

  // If the content is empty, return null
  if (isEmpty) return null;

  return <div ref={rendererRef} className="ql-editor ql-renderer" />;
};

export default Renderer;
