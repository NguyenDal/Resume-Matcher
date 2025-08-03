import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { BASE_URL } from "./api";

// Create a context to manage authentication state and actions.
const AuthContext = createContext();

// Custom hook to access the authentication context.
export function useAuth() {
    return useContext(AuthContext);
}

// AuthProvider component to wrap the application and provide authentication context.
export function AuthProvider({ children }) {
    // Initialize the user state by checking localStorage for existing authentication data.
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem("token"); // Retrieve the JWT token from localStorage.
        const email = localStorage.getItem("email"); // Retrieve the user's email from localStorage.
        const username = localStorage.getItem("username"); // Retrieve the user's username from localStorage.
        // If all required data exists, return the user object; otherwise, return null.
        return token && email && username ? { token, email, username } : null;
    });

    // Function to set authentication data and update localStorage.
    const setAuthData = ({ token, email, username }) => {
        localStorage.setItem("token", token); // Save the JWT token to localStorage.
        localStorage.setItem("email", email); // Save the user's email to localStorage.
        localStorage.setItem("username", username); // Save the user's username to localStorage.
        setUser({ token, email, username }); // Update the user state with the new data.
    };

    // Function to perform the login API call and set authentication data on success.
    const performLogin = async (usernameOrEmail, password) => {
        const params = new URLSearchParams(); // Create URL-encoded parameters for the login request.
        params.append("username", usernameOrEmail); // Add the username or email to the parameters.
        params.append("password", password); // Add the password to the parameters.
        params.append("grant_type", "password"); // Specify the grant type for the OAuth2 flow.
        const res = await axios.post(`${BASE_URL}/login/`, params, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }, // Set the content type for the request.
        });
        // On successful login, save the returned token, email, and username to localStorage and state.
        setAuthData({
            token: res.data.access_token,
            email: res.data.email,
            username: res.data.username,
        });
    };

    // Function to log out the user by clearing authentication data from localStorage and state.
    const logout = () => {
        localStorage.removeItem("token"); // Remove the JWT token from localStorage.
        localStorage.removeItem("email"); // Remove the user's email from localStorage.
        localStorage.removeItem("username"); // Remove the user's username from localStorage.
        setUser(null); // Reset the user state to null.
    };

    // Provide the authentication context to child components.
    return (
        <AuthContext.Provider value={{ user, login: performLogin, setAuthData, logout }}>
            {children}
        </AuthContext.Provider>
    );
}