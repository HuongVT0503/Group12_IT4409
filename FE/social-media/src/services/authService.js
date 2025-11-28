//login logout register func

// src/services/authService.js

//helper to handle response parsing n errors
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed.");
  }
  return data;
};

export const loginUser = async (credentials) => {
  //credentials: { identifier, password, remember }
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse(res);
};

export const registerUser = async (payload) => {
  //payload expects the form obj structure that backend requires
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), 
  });
  return handleResponse(res);
};