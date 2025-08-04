import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "./api";
import { FiLock } from "react-icons/fi";

// Helper to read a query param from URL
function useQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

export default function ResetPassword({ onBackToLogin }) {
  const token = useQueryParam("token"); // token from the reset link
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Optional: You can verify the token is valid on mount.
  useEffect(() => {
    if (!token) {
      setErr("Invalid or missing reset token.");
    }
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    setErr("");

    if (!newPassword || !confirmPassword) {
      setErr("Please enter your new password twice.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("new_password", newPassword);

      const res = await axios.post(`${BASE_URL}/reset-password/`, formData);
      if (res.data.ok) {
        setSuccess(true);
      } else {
        setErr("Could not reset password. Please try again.");
      }
    } catch (error) {
      setErr(
        error.response?.data?.detail ||
        error.message ||
        "Password reset failed. Please try again."
      );
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-purple-500 to-blue-400">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md px-8 py-12">
          <div className="text-xl font-bold text-red-600 mb-4">Invalid Link</div>
          <div className="mb-6 text-gray-700">This password reset link is invalid or missing.</div>
          <button
            onClick={onBackToLogin}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-purple-500 to-blue-400">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md px-8 py-12">
          <div className="text-2xl font-bold text-green-700 mb-4">Password Reset!</div>
          <div className="mb-6 text-gray-700">Your password has been updated. You can now log in with your new password.</div>
          <button
            onClick={onBackToLogin}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-purple-500 to-blue-400">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md px-8 py-12">
        <div className="text-2xl font-bold text-gray-800 mb-6">Reset Your Password</div>
        <form className="space-y-5" onSubmit={handleReset}>
          <div className="flex items-center border-b border-gray-200 py-2">
            <FiLock className="text-gray-400 mr-2" />
            <input
              type="password"
              placeholder="New Password"
              className="w-full outline-none border-0 bg-transparent px-1 py-2 text-gray-700"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex items-center border-b border-gray-200 py-2">
            <FiLock className="text-gray-400 mr-2" />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="w-full outline-none border-0 bg-transparent px-1 py-2 text-gray-700"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {err && <div className="text-red-500 text-sm">{err}</div>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow transition"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Set New Password"}
          </button>
        </form>
        <div className="text-center mt-6 text-gray-500 text-sm">
          Remembered?{" "}
          <button
            onClick={onBackToLogin}
            className="text-purple-600 font-semibold hover:underline"
            type="button"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
