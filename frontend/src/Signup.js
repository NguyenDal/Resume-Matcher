import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "./api";
import { FiMail, FiLock } from "react-icons/fi";

export default function Signup({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("email", email);
      params.append("password", password);
      await axios.post(`${BASE_URL}/register/`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      // After signup, log in automatically:
      const loginParams = new URLSearchParams();
      loginParams.append("username", email);
      loginParams.append("password", password);
      loginParams.append("grant_type", "password");
      const res = await axios.post(`${BASE_URL}/login/`, loginParams, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      onLogin(res.data); // Pass token etc. up
    } catch (error) {
      setErr(
        error.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-800 via-purple-500 to-blue-400 relative overflow-hidden">
      {/* Top nav */}
      <header className="absolute top-0 left-0 w-full px-8 py-5 flex justify-between items-center z-10">
        <div className="text-white text-2xl font-bold tracking-tight">TalentMatch</div>
        <nav className="space-x-8 hidden md:block">
          <a href="#" className="text-white hover:text-purple-200 transition">Home</a>
          <a href="#" className="text-white hover:text-purple-200 transition">Product</a>
          <a href="#" className="text-white hover:text-purple-200 transition">Services</a>
          <a href="#" className="text-white hover:text-purple-200 transition">Contact</a>
        </nav>
        <button className="border border-white text-white px-5 py-2 rounded hover:bg-white hover:text-purple-700 font-medium transition hidden md:block">
          Signup
        </button>
      </header>

      {/* Center signup card */}
      <div className="flex items-center justify-center w-full min-h-screen">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md px-8 py-10 mt-24 mb-10 relative z-20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Sign Up</h2>
            <span />
          </div>
          <form className="space-y-5" onSubmit={handleSignup}>
            <div className="flex items-center border-b border-gray-200 py-2">
              <FiMail className="text-gray-400 mr-2" />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full outline-none border-0 bg-transparent px-1 py-2 text-gray-700"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex items-center border-b border-gray-200 py-2">
              <FiLock className="text-gray-400 mr-2" />
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full outline-none border-0 bg-transparent px-1 py-2 text-gray-700"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {err && <div className="text-red-500 text-sm">{err}</div>}
            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow transition"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
          <div className="text-center mt-5 text-gray-500 text-sm">
            Already have an account?{" "}
            <button onClick={onSwitch} className="text-purple-600 font-semibold hover:underline" type="button">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
