import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { BASE_URL } from "./api";

// Create a context to manage authentication state and actions.
const AuthContext = createContext();

// Custom hook to access the authentication context.
export function useAuth() {
    return useContext(AuthContext);
}

// Helper function to get auth data from storage (sessionStorage first, then localStorage).
function getStoredAuth() {
    // Try sessionStorage first
    let token = sessionStorage.getItem("token");
    let email = sessionStorage.getItem("email");
    let username = sessionStorage.getItem("username");
    // If not found in sessionStorage, try localStorage
    if (!token || !email || !username) {
        token = localStorage.getItem("token");
        email = localStorage.getItem("email");
        username = localStorage.getItem("username");
    }
    return token && email && username ? { token, email, username } : null;
}

// AuthProvider component to wrap the application and provide authentication context.
export function AuthProvider({ children }) {
    // Initialize the user state by checking sessionStorage, then localStorage for existing authentication data.
    const [user, setUser] = useState(getStoredAuth);

    // Function to set authentication data and update the appropriate storage based on "remember me".
    const setAuthData = ({ token, email, username }, remember = false) => {
        if (remember) {
            // Save the JWT token, email, and username to localStorage.
            localStorage.setItem("token", token);
            localStorage.setItem("email", email);
            localStorage.setItem("username", username);
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("email");
            sessionStorage.removeItem("username");
        } else {
            // Save the JWT token, email, and username to sessionStorage.
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("email", email);
            sessionStorage.setItem("username", username);
            localStorage.removeItem("token");
            localStorage.removeItem("email");
            localStorage.removeItem("username");
        }
        setUser({ token, email, username }); // Update the user state with the new data.
    };

    // Function to perform the login API call and set authentication data on success.
    // Accepts an optional "remember" parameter to indicate storage preference.
    const performLogin = async (usernameOrEmail, password, remember = false) => {
        const params = new URLSearchParams(); // Create URL-encoded parameters for the login request.
        params.append("username", usernameOrEmail); // Add the username or email to the parameters.
        params.append("password", password); // Add the password to the parameters.
        params.append("grant_type", "password"); // Specify the grant type for the OAuth2 flow.
        const res = await axios.post(`${BASE_URL}/login/`, params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }, // Set the content type for the request.
        });
        // On successful login, save the returned token, email, and username to the appropriate storage and state.
        setAuthData({
            token: res.data.access_token,
            email: res.data.email,
            username: res.data.username,
        }, remember);
        return res.data;
    };

    // Function to log out the user by clearing authentication data from both storages and state.
    const logout = () => {
        localStorage.removeItem("token"); // Remove the JWT token from localStorage.
        localStorage.removeItem("email"); // Remove the user's email from localStorage.
        localStorage.removeItem("username"); // Remove the user's username from localStorage.
        sessionStorage.removeItem("token"); // Remove the JWT token from sessionStorage.
        sessionStorage.removeItem("email"); // Remove the user's email from sessionStorage.
        sessionStorage.removeItem("username"); // Remove the user's username from sessionStorage.
        setUser(null); // Reset the user state to null.
    };

    // Provide the authentication context to child components.
    return (
        <AuthContext.Provider value={{ user, login: performLogin, setAuthData, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
