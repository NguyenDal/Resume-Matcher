import React, { useState } from "react";
import ResumeMatcher from "./ResumeMatcher";
import { AuthProvider, useAuth } from "./AuthContext";
import Signup from "./Signup";
import Login from "./Login";

// Profile page placeholder
function ProfilePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-2xl font-semibold text-gray-700 mb-2">User Profile</div>
      <div className="text-gray-500">This page is under construction.</div>
    </div>
  );
}

// Main content after login
const MainContent = () => {
  const [menu, setMenu] = useState("matcher");
  const { logout, user } = useAuth();

  return (
    <div>
      {/* NAV BAR */}
      <nav className="w-full bg-blue-600 shadow flex justify-between items-center px-6 py-3 mb-4">
        <div className="text-white font-bold text-xl">TalentMatch</div>
        <div className="flex space-x-4 items-center">
          <button
            onClick={() => setMenu("matcher")}
            className={`px-4 py-2 rounded-lg font-medium ${
              menu === "matcher"
                ? "bg-white text-blue-600 shadow"
                : "text-white hover:bg-blue-700 transition"
            }`}
          >
            Job Matching
          </button>
          <button
            onClick={() => setMenu("profile")}
            className={`px-4 py-2 rounded-lg font-medium ${
              menu === "profile"
                ? "bg-white text-blue-600 shadow"
                : "text-white hover:bg-blue-700 transition"
            }`}
          >
            Profile
          </button>
          <span className="text-white ml-6">{user?.email}</span>
          <button
            onClick={logout}
            className="ml-2 px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
          >
            Logout
          </button>
        </div>
      </nav>
      {/* MAIN CONTENT */}
      <div>
        {menu === "matcher" ? <ResumeMatcher /> : <ProfilePlaceholder />}
      </div>
    </div>
  );
};

// Main App
const App = () => {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {showLogin
          ? <Login onSwitch={() => setShowLogin(false)} />
          : <Signup onSwitch={() => setShowLogin(true)} />
        }
      </div>
    );
  }

  return <MainContent />;
};

// Root export wrapped in AuthProvider
export default function WrappedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
