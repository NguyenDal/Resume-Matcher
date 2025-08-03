import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Check localStorage for token
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    return token && email ? { token, email } : null;
  });

  // Login: Save token/email
  const login = (token, email) => {
    localStorage.setItem("token", token);
    localStorage.setItem("email", email);
    setUser({ token, email });
  };

  // Logout: Remove token/email
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
