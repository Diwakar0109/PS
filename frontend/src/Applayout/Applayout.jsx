import React, { useContext } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Header from "../components/Header/Header";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardPage from "../pages/DashboardPage/DashboardPage";
import { AuthContext } from "../App";
import Navbar from "../components/navbar/Navbar";

// --- CHANGE #1: REMOVE the old ExamPage import ---
// import ExamPage from "../pages/ExamPage/ExamPage";

// --- CHANGE #2: IMPORT the new dispatcher component ---
import ExamPageDispatcher from "../pages/ExamPage/ExamPageDispatcher.jsx";

const Applayout = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const isExamPage = location.pathname.startsWith("/exam");

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <main className="h-screen overflow-hidden">
      {!isExamPage && <Navbar />}
      <div
        className={`${
          !isExamPage ? "lg:pl-20" : ""
        } h-screen overflow-y-auto bg-[#EEF1F9]`}
      >
        {!isExamPage && <Header />}
        <main className={!isExamPage ? "pt-[70px]" : "pt-0"}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exam/:subject/:level"
              element={
                <ProtectedRoute>
                  {/* --- CHANGE #3: Use the new dispatcher here instead of the old component --- */}
                  <ExamPageDispatcher />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to={"/dashboard"} />} />
          </Routes>
        </main>
      </div>
    </main>
  );
};

export default Applayout;