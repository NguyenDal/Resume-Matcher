import React from "react";
import { useAuth } from "./AuthContext";

// Main authenticated navigation bar for logged-in users.
export default function NavBar({ setMenu, menu }) {
  const { user, logout } = useAuth();
  return (
    <nav className="w-full bg-blue-600 shadow flex justify-between items-center px-6 py-3 mb-4">
      <div className="text-white font-bold text-xl">TalentMatch</div>
      <div className="flex space-x-4 items-center">
        <button
          onClick={() => setMenu && setMenu("matcher")}
          className={`px-4 py-2 rounded-lg font-medium ${menu === "matcher"
            ? "bg-white text-blue-600 shadow"
            : "text-white hover:bg-blue-700 transition"
            }`}
        >Job Matching</button>
        <button
          onClick={() => setMenu && setMenu("profile")}
          className={`px-4 py-2 rounded-lg font-medium ${menu === "profile"
            ? "bg-white text-blue-600 shadow"
            : "text-white hover:bg-blue-700 transition"
            }`}
        >Profile</button>
        {user && <span className="text-white ml-6">{user?.username}</span>}
        {user && (
          <button
            onClick={logout}
            className="ml-2 px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
