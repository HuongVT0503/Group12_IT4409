//login logout register func

// src/services/authService.js

//helper to handle response parsing n errors

import api from "./api";

// const handleResponse = async (response) => {
//   const data = await response.json();
//   if (!response.ok) {
//     throw new Error(data?.error || data?.message || "Request failed.");
//   }
//   return data;
// };

export const loginUser = async (credentials) => {
 

  // const res = await fetch("/api/auth/login", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(credentials),
  // });


  //credentials be expects: { email,pswd }
  //credential.identifier = email
  const payload = {
    email: credentials.identifier,
    password: credentials.password
  };
  const response = await api.post('/auth/login', payload);

  //be returns {user, accessToken, refreshToken, }
  if (response.data.accessToken) {
    localStorage.setItem('token', response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const registerUser = async (payload) => {
  //be expects {username, email, password, display_name}

  const body = {
    username: payload.form.email.split('@')[0]+ Math.floor(Math.random() * 1000), // user gen
    email: payload.form.email,
    password: payload.form.password,
    display_name: `${payload.form.firstName} ${payload.form.lastName}`.trim()
    //////
    //!!BE doesnt save phone/dob/gender in ueRepository.js
    /////
  };
  
  return await api.post('/auth/register', body);


  // const res = await fetch("/api/auth/register", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload), 
  // });
  // return handleResponse(res);
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = '/login';
};