import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../App";
import UserProfileModal from "../UserProfileModal/UserProfileModal";
import userpng from "../../assets/userPS.png";

const Header = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Note: The logout function is handled within the UserProfileModal
  // so a separate handleLogout here is not needed unless you add another logout button.

  return (
    <>
      {/* --- FIX: Updated header classes for correct layout and appearance --- */}
      <header className="fixed top-0 left-0 lg:left-20 right-0 z-30 bg-white h-[70px] flex items-center border-b border-slate-200">
        <div className="w-full flex justify-between items-center px-6">
          {/* Logo */}
          <div className="text-2xl font-bold text-gray-900">CodePlatform</div>

          {/* Right Side Navigation */}
          <div className="flex items-center gap-6">
            {/* Profile Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="lg:w-[250px] w-[50px] sm:w-[200px] h-[55px] rounded-md flex items-center gap-3 bg-gray-100 hover:bg-gray-200 transition"
            >
              {/* Avatar */}
              <div className="flex justify-center items-center h-full w-[50px] flex-shrink-0">
                <img
                  src={userpng}
                  alt="user"
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>

              {/* ID + Name (hidden on small screens) */}
              <div className="hidden sm:flex py-4 flex-col text-left">
                <span className="text-[13px] mb-0.5 font-medium text-gray-800">
                  {user?.rollno ? user.rollno : "-----------"}
                </span>
                <span className="text-[16px] font-semibold text-gray-900">
                  {user?.username?.toUpperCase()}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
      />
    </>
  );
};

export default Header;
