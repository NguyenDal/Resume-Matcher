import React from "react";
import { useNavigate } from "react-router-dom";

// Public navigation bar for unauthenticated users.
export default function PublicNavBar() {
    const navigate = useNavigate();
    return (
        <header className="absolute top-0 left-0 w-full px-8 py-5 flex justify-between items-center z-10">
            <div className="text-white text-2xl font-bold tracking-tight">TalentMatch</div>
            <nav className="space-x-8 hidden md:block">
                <a href="#" className="text-white hover:text-purple-200 transition">Home</a>
                <a href="#" className="text-white hover:text-purple-200 transition">Product</a>
                <a href="#" className="text-white hover:text-purple-200 transition">Services</a>
                <a href="#" className="text-white hover:text-purple-200 transition">Contact</a>
            </nav>
            <button
                className="border border-white text-white px-5 py-2 rounded hover:bg-white hover:text-purple-700 font-medium transition hidden md:block"
                onClick={() => navigate("/")}
            >
                Login
            </button>
        </header>
    );
}

