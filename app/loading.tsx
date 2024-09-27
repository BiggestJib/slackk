import React from "react";
import { FiLoader } from "react-icons/fi"; // Importing loader icon

const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-600 to-[#5E2C5F]">
      <div className="text-center flex flex-col items-center space-y-6">
        {/* Loader icon with smooth animation */}
        <FiLoader className="text-white w-16 h-16 animate-spin" />

        {/* Loading message */}
        <h1 className="text-2xl font-bold text-white animate-pulse">
          Loading...
        </h1>

        {/* Optional subtext */}
        <p className="text-white text-opacity-80">
          We're getting things ready for you!
        </p>
      </div>
    </div>
  );
};

export default LoadingPage;
