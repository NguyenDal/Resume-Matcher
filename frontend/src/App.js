import React, { useState } from "react";
import ResumeMatcher from "./ResumeMatcher";

function ProfilePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="text-2xl font-semibold text-gray-700 mb-2">User Profile</div>
      <div className="text-gray-500">This page is under construction.</div>
    </div>
  );
}

const App = () => {
  const [menu, setMenu] = useState("matcher");

  return (
    <div>
      {/* NAV BAR */}
      <nav className="w-full bg-blue-600 shadow flex justify-between items-center px-6 py-3 mb-4">
        <div className="text-white font-bold text-xl">TalentMatch</div>
        <div className="flex space-x-4">
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
        </div>
      </nav>
      {/* MAIN CONTENT */}
      <div>
        {menu === "matcher" ? <ResumeMatcher /> : <ProfilePlaceholder />}
      </div>
    </div>
  );
};

export default App;
