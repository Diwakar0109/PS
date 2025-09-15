import React from "react";
import userpng from "../../assets/userPS.png";

function UserProfileModal({isOpen, onClose, user}) {
  if (!isOpen) return null;

  return (
    // Overlay: Dims the background
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose} // Close modal on overlay click
    >
      {/* Modal Card: Made responsive with w-full and max-w-md */}
      <div
        className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <div className="px-4 sm:px-8">
          {/* Header */}
          <h2 className="text-xl font-bold text-gray-900 mb-6">User Profile</h2>

          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <img
              src={userpng}
              alt="User Avatar"
              className="h-32 w-32 rounded-full object-cover"
            />
          </div>

          {/* User Info Section */}
          <div className="space-y-5">
            {/* Roll Number */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <span className="text-base font-medium text-gray-600">
                Roll Number
              </span>
              <span className="text-base font-semibold text-gray-900">
                {user?.rollNumber || "N/A"}
              </span>
            </div>
            {/* Name */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <span className="text-base font-medium text-gray-600">Name</span>
              <span className="text-base font-semibold text-gray-900">
                {user?.username || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Close Button Container: Centered using flexbox */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={onClose}
            className="w-[70%] rounded-lg bg-violet-500 py-3
             text-base font-semibold text-white transition hover:bg-violet-600
              focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;
