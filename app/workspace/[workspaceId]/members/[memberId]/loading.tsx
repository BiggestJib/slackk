import { Loader } from "lucide-react";
import React from "react";
import { FiLoader } from "react-icons/fi"; // Importing loader icon

const LoadingPage = () => {
  return (
    <div className="flex flex-col bg-[#5E2C5f] h-full items-center justify-center">
    <Loader className="size-5 animate-spin text-white" />
  </div>
  );
};

export default LoadingPage;
