import React, { useState } from "react";
import ResumeMatcher from "./ResumeMatcher";
import { AuthProvider, useAuth } from "./AuthContext";
import Signup from "./Signup";
import Login from "./Login";

// Placeholder component for the user profile page.
function ProfilePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-2xl font-semibold text-gray-700 mb-2">User Profile</div>
      <div className="text-gray-500">This page is under construction.</div>
    </div>
  );
}

// MainContent component handles the navigation and main content display.
const MainContent = () => {
  const [menu, setMenu] = useState("matcher"); // State to track the active menu (Job Matching or Profile).
  const { logout, user } = useAuth(); // Access authentication context for user data and logout functionality.

  return (
    <div>
      {/* Navigation bar with menu options and user information */}
      <nav className="w-full bg-blue-600 shadow flex justify-between items-center px-6 py-3 mb-4">
        <div className="text-white font-bold text-xl">TalentMatch</div>
        <div className="flex space-x-4 items-center">
          {/* Button to switch to the Job Matching view */}
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
          {/* Button to switch to the Profile view */}
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
          {/* Display the logged-in user's username */}
          <span className="text-white ml-6">{user?.username}</span>
          {/* Logout button */}
          <button
            onClick={logout}
            className="ml-2 px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
          >
            Logout
          </button>
        </div>
      </nav>
      {/* Render the appropriate content based on the active menu */}
      <div>{menu === "matcher" ? <ResumeMatcher /> : <ProfilePlaceholder />}</div>
    </div>
  );
};

// App component handles authentication and renders the main content or login/signup forms.
const App = () => {
  const { user, setAuthData, login } = useAuth(); // Access authentication context.
  const [showLogin, setShowLogin] = useState(true); // State to toggle between login and signup forms.

  // Handler to set authentication data after a successful signup.
  const handleLogin = (data) => {
    setAuthData({
      token: data.access_token,
      email: data.email,
      username: data.username,
    });
  };

  // If no user is logged in, show the login or signup form.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {showLogin ? (
          <Login onSwitch={() => setShowLogin(false)} onLogin={login} />
        ) : (
          <Signup onSwitch={() => setShowLogin(true)} onLogin={handleLogin} />
        )}
      </div>
    );
  }

  // If a user is logged in, render the main content.
  return <MainContent />;
};

// WrappedApp component wraps the App component with the AuthProvider to provide authentication context.
export default function WrappedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
