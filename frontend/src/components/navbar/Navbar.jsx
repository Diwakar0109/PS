import React, {useContext, useState} from "react";
import {NavLink, useNavigate} from "react-router-dom";
import {AuthContext} from "../../App";

// --- ICONS ---
// We'll use a consistent icon library for a clean look
import {Menu, X, PlaySquare, Layers, Pencil, Code2, LogOut} from "lucide-react";
import ps from "../../assets/ps.png"; // Your logo
import code from "../../assets/code.png";
function Navbar() {
  const {user, logout} = useContext(AuthContext);
  const [hamburger, setHamburger] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // --- REUSABLE COMPONENTS ---

  // Component for Desktop Nav Items (Icon + Tooltip on hover)
  const DesktopNavItem = ({to, icon: Icon, text}) => (
    <NavLink
      to={to}
      className={({isActive}) =>
        `group relative flex justify-center items-center h-12 w-12 rounded-lg cursor-pointer transition-colors duration-200 ${
          isActive
            ? "bg-purple-600 text-white"
            : "text-gray-500 hover:bg-purple-600 hover:text-white"
        }`
      }
    >
      <Icon size={24} />
      {/* Tooltip */}
      <div className="absolute left-16 w-auto min-w-max scale-0 origin-left rounded-md bg-purple-600   p-2 text-sm text-white shadow-md transition-all duration-200 group-hover:scale-100">
        {text}
      </div>
    </NavLink>
  );

  // Component for Mobile Nav Items (Icon + Text)
  const MobileNavItem = ({to, icon: Icon, text}) => (
    <NavLink
      to={to}
      onClick={() => setHamburger(false)} // Close menu on click
      className={({isActive}) =>
        `flex items-center gap-4 rounded-lg p-3 text-base font-medium transition-colors duration-200 ${
          isActive
            ? "bg-purple-100 text-purple-600"
            : "text-gray-600 hover:bg-purple-50"
        }`
      }
    >
      <Icon size={24} />
      <span>{text}</span>
    </NavLink>
  );

  // --- MAIN NAVBAR ---

  return (
    <>
      {/* =================================================================
       DESKTOP SIDEBAR (Visible on large screens)
      ================================================================= */}
      <aside className="hidden lg:fixed lg:top-1 lg:left-0 lg:z-40 lg:flex min-h-screen w-20 flex-col items-center gap-10 bg-white py-6">
        {/* Logo */}
        <div>
          <img src={code} alt="Logo" className="h-8 w-auto" />
        </div>

        {/* Main Navigation Icons */}
        <nav className="flex flex-col  gap-10 mt-36">
          {
            <DesktopNavItem
              to="/dashboard"
              icon={PlaySquare}
              text="Dashboard"
            />
          }
          {/* <DesktopNavItem to="/documents" icon={Layers} text="Documents" />
          <DesktopNavItem to="/assessments" icon={Pencil} text="Assessments" />
          <DesktopNavItem to="/codeReview" icon={Code2} text="Code Review" /> */}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="group relative flex justify-center items-center h-12 w-12 
          rounded-lg text-gray-500 hover:bg-purple-600 hover:text-white transition-colors"
        >
          <LogOut size={24} />
          <div className="absolute left-16 w-auto min-w-max scale-0 origin-left rounded-md bg-purple-600 p-2 text-sm text-white shadow-md transition-all duration-200 group-hover:scale-100">
            Logout
          </div>
        </button>
      </aside>

      {/* =================================================================
        MOBILE NAVIGATION (Visible on small screens)
      ================================================================= */}
      <div className="lg:hidden">
        {/* Hamburger Menu Button */}
        <button
          className="fixed top-4 left-4 z-40 text-gray-800"
          onClick={() => setHamburger(true)}
          aria-label="Open menu"
        >
          <Menu size={32} />
        </button>

        {/* Overlay */}
        {hamburger && (
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setHamburger(false)}
          ></div>
        )}

        {/* Mobile Sidebar */}
        <div
          className={`fixed top-0  max-h-screen left-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            hamburger ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between border-b p-4">
            {/* <img src={ps} alt="Logo" className="h-7 w-auto" /> */}
            <button
              onClick={() => setHamburger(false)}
              aria-label="Close menu"
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={28} />
            </button>
          </div>

          {/* Menu Links */}
          {
            <nav className="flex-1 space-y-2 p-4">
              <MobileNavItem
                to="/dashboard"
                icon={PlaySquare}
                text="Dashboard"
              />
            </nav>
          }

          {/* Menu Footer (Logout) */}
          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-4 rounded-lg p-3 text-base font-medium text-gray-600 hover:bg-purple-50"
            >
              <LogOut size={24} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
