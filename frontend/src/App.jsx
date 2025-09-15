import React, { useState, createContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import Applayout from "./Applayout/Applayout";
import "./App.css";

export const AuthContext = createContext(null);

// Create this new component to contain all your existing logic
function AppContent() {
  const [user, setUser] = useState(() => {
    // --- CHANGE #1 ---
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const location = useLocation();
  const isExamPage = location.pathname.startsWith("/exam/");

  const handleLogin = (userData) => {
    // --- CHANGE #2 ---
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    // --- CHANGE #3 ---
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUserSession = (updatedUserData) => {
    if (user) {
      // --- BONUS CHANGE FOR CONSISTENCY ---
      localStorage.setItem("user", JSON.stringify(updatedUserData));
      setUser(updatedUserData);
    }
  };

  const authContextValue = {
    user,
    login: handleLogin,
    logout: handleLogout,
    updateUserSession,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className={`app ${isExamPage ? "in-exam" : ""}`}>
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
            />
            <Route
              path="*"
              element={user ? <Applayout /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

function App() {
  return <AppContent />;
}

export default App;
