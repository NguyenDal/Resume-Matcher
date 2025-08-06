import React, { useRef, useState } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

// Dummy user info
const mockUser = {
  firstName: "John",
  lastName: "Doe",
  email: "emailis@private.com",
  profession: "UI/UX Designer",
  bio: "Open-Source designer @ UI Design Daily",
  avatar: "https://randomuser.me/api/portraits/men/4.jpg",
};

function ProfileDetails() {
  const [user] = useState(mockUser);
  const fileInput = useRef();
  return (
    <form className="max-w-3xl grid grid-cols-2 gap-8" onSubmit={e => e.preventDefault()}>
      <div className="col-span-2 flex items-center gap-8 mb-6">
        <img
          src={user.avatar}
          alt="Profile"
          className="w-28 h-28 rounded-full border-4 border-white shadow object-cover"
        />
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="bg-gray-900 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-700 transition"
            onClick={() => fileInput.current.click()}
          >
            Change picture
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={() => {/* handle image upload */ }}
          />
          <button
            type="button"
            className="border border-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition"
            onClick={() => {/* handle delete pic */ }}
          >
            Delete picture
          </button>
        </div>
      </div>
      <div className="col-span-1">
        <label className="block text-gray-700 font-medium mb-1">First name</label>
        <input
          type="text"
          defaultValue={user.firstName}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-1">
        <label className="block text-gray-700 font-medium mb-1">Last name</label>
        <input
          type="text"
          defaultValue={user.lastName}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-gray-700 font-medium mb-1">Email</label>
        <input
          type="email"
          defaultValue={user.email}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-gray-700 font-medium mb-1">Profession</label>
        <input
          type="text"
          defaultValue={user.profession}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-gray-700 font-medium mb-1">Bio</label>
        <textarea
          rows={3}
          defaultValue={user.bio}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-2 mt-6 flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md font-bold transition"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

function AccountSettings() {
  return <div className="max-w-3xl text-black">Account settings go here (change password, etc).</div>;
}
function Notifications() {
  return <div className="max-w-3xl text-black">Notification settings go here.</div>;
}
function Security() {
  return <div className="max-w-3xl text-black">Security settings go here (2FA, etc).</div>;
}

export default function ProfileSetting() {
  // Sidebar config
  const sidebar = [
    { name: "Public profile", path: "/profile" },
    { name: "Account settings", path: "/profile/account" },
    { name: "Notifications", path: "/profile/notifications" },
    { name: "Security", path: "/profile/security" },
  ];

  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center w-full bg-gradient-to-br from-blue-100 to-purple-200 py-10 min-h-[90vh]">
      {/* Main card */}
      <div className="w-full max-w-6xl mx-auto shadow-xl rounded-2xl bg-white flex"
        style={{ minHeight: "650px" }}
      >
        {/* Sidebar */}
        <aside className="w-72 border-r border-gray-200 px-8 py-10 relative">
          {/* Back arrow button */}
          <button
            onClick={() => navigate("/profile")} // Change to your Profile page route
            className="absolute left-4 top-4 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full shadow-lg p-2 transition flex items-center justify-center"
            style={{
              boxShadow: "0 4px 16px 0 rgba(0,0,0,0.07)",
              border: "2px solid white",
            }}
            aria-label="Back to profile"
          >
            <FiArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-8 text-gray-800 mt-9">Settings</h2>
          <nav className="flex flex-col gap-2">
            {sidebar.map(item => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/profile"}
                className={({ isActive }) =>
                  "px-4 py-2 text-left rounded-md font-medium transition " +
                  (isActive
                    ? "bg-blue-100 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700")
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </aside>
        {/* Main content */}
        <section className="flex-1 px-16 py-12 min-w-0 flex flex-col">
          <Routes>
            <Route path="/" element={<ProfileDetails />} />
            <Route path="/account" element={<AccountSettings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/security" element={<Security />} />
          </Routes>
        </section>
      </div>
    </div>
  );
}