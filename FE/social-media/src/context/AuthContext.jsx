//global user state

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token, remember=false) => {
    const isSessionOnly = userData.role === 'admin' || !remember; 
    const storage = isSessionOnly ? sessionStorage : localStorage;

    if (isSessionOnly) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    } else {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
    }

    storage.setItem("user", JSON.stringify(userData));
    storage.setItem("token", token);
    setUser(userData);
  };

  const updateUser = (updatedData) => {
    //merge cuurrengt user data w updates (to keep fields (email/id) if be dosnt return)
    const newUser = { ...user, ...updatedData };
    
    if (sessionStorage.getItem("user")) {
        sessionStorage.setItem("user", JSON.stringify(newUser));
    } else {
        localStorage.setItem("user", JSON.stringify(newUser));
    }

    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};