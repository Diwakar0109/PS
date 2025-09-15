import React, {useState, useContext} from "react";
import {useNavigate} from "react-router-dom";
import {AuthContext} from "../../App"; // Assuming AuthContext is in your App.js
import image from "../../assets/ps.png";
import google from "../../assets/google.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const {login} = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      login(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#EEF1F9]">
      <div className="bg-white shadow-md rounded-xl w-full max-w-md p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex justify-center items-center space-x-3 mb-5">
          {/* <img src={image} alt="logo" className="h-10 w-10" /> */}
          <h4 className="text-base sm:text-lg font-semibold text-black">
            Code Platform
          </h4>
        </div>

        {/* Welcome Back */}
        <h1 className="text-lg sm:text-xl font-semibold text-[#8057F6] text-center mb-6">
          Hi, Welcome Back!
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-black mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-9 sm:h-10 px-3 rounded-md border border-[#ECEEF5] bg-[#EEF1F9] text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#7D53F6]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-black mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-9 sm:h-10 px-3 rounded-md border border-[#ECEEF5] bg-[#EEF1F9] text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#7D53F6]"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="hover:cursor-pointer w-full h-10 sm:h-11 bg-[#7D53F6] text-white text-base sm:text-lg rounded-md hover:opacity-90 transition"
          >
            Login
          </button>
        </form>

        {/* Or */}
        <div className="flex justify-center my-4">
          <p className="text-gray-500">or</p>
        </div>

        {/* Google Button */}
        <div className="flex justify-center">
          <button
            type="button"
            className="flex items-center border border-[#ECEEF5] rounded-md px-4 py-2 bg-white hover:shadow-md transition 
            w-full sm:w-auto sm:items-center"
          >
            <img src={google} alt="google" className="w-5 h-5" />
            <span className="ml-2 text-sm text-black">Sign in with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
