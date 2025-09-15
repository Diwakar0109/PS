import React from "react";

// Enhanced Spinner co
const Spinner = () => (
  <div className="flex justify-center items-center p-12">
    <div className="relative">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
    </div>
  </div>
);
export default Spinner;