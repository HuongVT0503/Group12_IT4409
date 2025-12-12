//import { useState } from 'react'
//import './App.css'
import Login from "./pages/auth/LogInPage"
import Signup from "./pages/auth/SignUpPage"
import Feed from "./pages/feed/FeedPage"

import { BrowserRouter, Routes, Route, Navigate , useNavigate} from "react-router-dom";

import MainLayout from './components/layout/MainLayout';
import ProfilePage from "./pages/profile/ProfilePage";

import { useAuth } from "./context/AuthContext";

const Placeholder = ({ title }) => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-gray-400">{title}</h1>
    <p className="text-gray-500">This page is under construction.</p>
  </div>
);


function AppRouter() {
  //toplvl component

  const { user, loading } = useAuth();

  //const isAuthenticated = false;
  const navigate = useNavigate();

  if (loading) return <div>Loading...</div>;

  //const [view, setView] = useState("login"); //default view

  return (

    
      <Routes>
        {/* PUBLIC ROUTES (No Layout) */}
        <Route path="/login" element={!user ? <Login onSwitch={() => navigate("/signup")} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup onSwitch={() => navigate("/login")} /> : <Navigate to="/" />} />


        {/*PREVIEW ROUTE*/}
        <Route path="/preview" element={<MainLayout />}>
        <Route path="/previewprofile" element={<ProfilePage />} />
        <Route index element={<Feed />} />
      </Route>
      {/*PREVIEW ROUTE*/}




        {/* PROTECTED ROUTES */}
        <Route 
          path="/" 
          element={user ? <MainLayout /> : <Navigate to="/login"  replace />}
        >
          
          <Route index element={<Feed />} /> 
          
          <Route path="profile" element={<  ProfilePage  />} />
          <Route path="chat" element={<Placeholder title="Chat / Messages" />} />
          <Route path="connections" element={<Placeholder title="Connections" />} />
          <Route path="create" element={<Placeholder title="Create Post" />} />
        </Route>

        {/* 404 CATCH ALL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    
  
    // <main className="w-full min-h-screen">
    //   {view === "login" 
    //     ? <Login onSwitch={() => setView("signup")} /> 
    //     : <Signup onSwitch={() => setView("login")} onBack={() => setView("login")} />
    //   }
    // </main>
  );
  
  
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}