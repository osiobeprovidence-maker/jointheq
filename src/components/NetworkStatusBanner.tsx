import React from "react";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export const NetworkStatusBanner: React.FC = () => {
  const { online, effectiveType } = useNetworkStatus();

  if (online) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 flex items-center justify-center">
      <div className="bg-yellow-600 text-white px-4 py-2 rounded-b-md shadow-md font-medium">
        You are offline — some features may be unavailable. {effectiveType ? `Connection: ${effectiveType}` : ''}
      </div>
    </div>
  );
};

export default NetworkStatusBanner;
