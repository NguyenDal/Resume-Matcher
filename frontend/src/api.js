// Base URL for the backend API. Update this in production to match the deployed server's address.
export const BASE_URL = "http://localhost:8000";

// Function to generate authorization headers for API requests.
// It retrieves the JWT token from localStorage and includes it in the headers if available.
export function getAuthHeaders() {
  const token = localStorage.getItem("token"); // Retrieve the token from localStorage.
  return token ? { Authorization: `Bearer ${token}` } : {}; // Return headers with the token if it exists.
}