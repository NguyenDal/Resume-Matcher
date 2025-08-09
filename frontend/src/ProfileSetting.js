import React, { useRef, useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { BASE_URL } from "./api";
import { useAuth } from "./AuthContext";

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
  const fileInput = useRef();

  // --- NEW: real user state pulled from backend, fallback to mock ---
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(mockUser.avatar);
  const [firstName, setFirstName] = useState(mockUser.firstName);
  const [lastName, setLastName] = useState(mockUser.lastName);
  const [email, setEmail] = useState(mockUser.email);
  const [profession, setProfession] = useState(mockUser.profession);
  const [bio, setBio] = useState(mockUser.bio);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = authUser?.token || localStorage.getItem("token");
        if (!token) throw new Error("Not logged in");
        const res = await axios.get(`${BASE_URL}/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Backend returns: first_name, last_name, email, profile_image_url, profession, bio
        setAvatar(res.data.profile_image_url || "");
        setFirstName(res.data.first_name || "");
        setLastName(res.data.last_name || "");
        setEmail(res.data.email || "");
        setProfession(res.data.profession || "");
        setBio(res.data.bio || "");
      } catch (_) {
        // Fallback to mock if anything fails
        setAvatar(mockUser.avatar);
        setFirstName(mockUser.firstName);
        setLastName(mockUser.lastName);
        setEmail(mockUser.email);
        setProfession(mockUser.profession);
        setBio(mockUser.bio);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [authUser]);

  const handleImageUploadClick = () => fileInput.current?.click();

  // --- Upload image to existing /upload-profile-image/ endpoint ---
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant preview
    const preview = URL.createObjectURL(file);
    const prevAvatar = avatar;
    setAvatar(preview);

    try {
      const token = authUser?.token || localStorage.getItem("token");
      const form = new FormData();
      form.append("image", file);
      const res = await axios.post(`${BASE_URL}/upload-profile-image/`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data?.profile_image_url) {
        setAvatar(res.data.profile_image_url);
        setMsg("Profile image updated.");
      } else {
        // rollback if backend didn't return a URL
        setAvatar(prevAvatar);
        setMsg("Upload failed. Please try again.");
      }
    } catch (err) {
      // rollback preview on error
      setAvatar(prevAvatar);
      setMsg(err.response?.data?.detail || "Upload failed.");
    } finally {
      try {
        URL.revokeObjectURL(preview);
      } catch {}
    }
  };

  // --- Delete image: clears locally and persists via backend ---
  const handleDeleteImage = async () => {
    const prevAvatar = avatar;
    setAvatar(""); // immediately reflect deletion in UI

    try {
      const token = authUser?.token || localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/profile/clear-image/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg("Profile image removed.");
    } catch {
      // If backend route fails for any reason, roll back UI
      setAvatar(prevAvatar);
      setMsg("Failed to remove image.");
    }
  };

  // Save Changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      const token = authUser?.token || localStorage.getItem("token");

      // IMPORTANT: send FormData so FastAPI's Form(...) fields receive values
      const form = new FormData();
      form.append("first_name", firstName);
      form.append("last_name", lastName);
      form.append("email", email);         // include only if your API allows editing email
      form.append("profession", profession);
      form.append("bio", bio);

      await axios.patch(`${BASE_URL}/profile/update/`, form, {
        headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type manually
      });

      setMsg("Saved.");
    } catch (err) {
      setMsg(err.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl text-black">Loading profile…</div>;
  }

  return (
    <form className="max-w-3xl grid grid-cols-2 gap-8" onSubmit={handleSubmit}>
      <div className="col-span-2 flex items-center gap-8 mb-6">
        <img
          src={avatar || "https://via.placeholder.com/112?text=No+Avatar"}
          alt="Profile"
          className="w-28 h-28 rounded-full border-4 border-white shadow object-cover"
        />
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="bg-gray-900 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-700 transition"
            onClick={handleImageUploadClick}
          >
            Change picture
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            className="border border-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition"
            onClick={handleDeleteImage}
          >
            Delete picture
          </button>
          {msg && <span className="text-sm text-gray-600">{msg}</span>}
        </div>
      </div>
      <div className="col-span-1">
        <label className="block text-gray-700 font-medium mb-1">First name</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-1">
        <label className="block text-gray-700 font-medium mb-1">Last name</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-gray-700 font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-gray-700 font-medium mb-1">Profession</label>
        <input
          type="text"
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-2">
        <label className="block text-gray-700 font-medium mb-1">Bio</label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 bg-white text-black"
        />
      </div>
      <div className="col-span-2 mt-6 flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md font-bold transition"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
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