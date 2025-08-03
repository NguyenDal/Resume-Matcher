import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { FiMail, FiLock } from "react-icons/fi";

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password); // Call AuthContext login
      // If successful, AuthContext will handle state
    } catch (e) {
      setErr(
        e?.response?.data?.detail ||
        e.message ||
        "Login failed. Please check your credentials."
      );
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
          Login
        </button>
      </header>

      {/* Center login card */}
      <div className="flex items-center justify-center w-full min-h-screen">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md px-8 py-10 mt-24 mb-10 relative z-20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Login</h2>
            <span />
          </div>
          <form className="space-y-5" onSubmit={handleLogin}>
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
            <div className="flex items-center justify-between text-sm mt-1">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" disabled /> Remember me
              </label>
              <button
                type="button"
                className="text-purple-600 hover:underline"
                disabled
              >
                Forgot password?
              </button>
            </div>
            {err && <div className="text-red-500 text-sm">{err}</div>}
            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow transition"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login Now"}
            </button>
          </form>
          <div className="text-center mt-5 text-gray-500 text-sm">
            Not a member?{" "}
            <button onClick={onSwitch} className="text-purple-600 font-semibold hover:underline" type="button">
              Signup Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
