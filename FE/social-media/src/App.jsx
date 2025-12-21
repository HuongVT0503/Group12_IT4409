//import { useState } from 'react'
//import './App.css'
import Login from "./pages/auth/LogInPage";
import Signup from "./pages/auth/SignUpPage";
import Feed from "./pages/feed/FeedPage";
import ChatPage from "./pages/chat/ChatPage";
import CreatePostPage from "./pages/feed/CreatePostPage";
import ConnectionsPage from "./pages/connections/ConnectionPage";
import SettingsPage from './pages/settings/SettingsPage';
import PostDetailsPage from "./pages/feed/PostDetailsPage";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import ProfilePage from "./pages/profile/ProfilePage";

import { useAuth } from "./context/AuthContext";

// const Placeholder = ({ title }) => (
//   <div className="p-8 text-center">
//     <h1 className="text-2xl font-bold text-gray-400">{title}</h1>
//     <p className="text-gray-500">This page is under construction.</p>
//   </div>
// );

function AppRouter() {
  //toplvl component

  const { user, loading } = useAuth();
  const location = useLocation();

  //const isAuthenticated = false;
  const navigate = useNavigate();

  if (loading) return <div>Loading...</div>;

  //const [view, setView] = useState("login"); //default view

  return (
    <Routes>
      {/* PUBLIC ROUTES (No Layout) */}
      <Route
        path="/login"
        element={
          !user ? (
            <Login onSwitch={() => window.location.href = '/signup'} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/signup"
        element={
          !user ? (
            <Signup
              onSwitch={() => window.location.href = '/login'}
              onSuccess={(data) => navigate("/login", { 
                state: { 
                  email: data.user?.email, 
                  message: "Account created successfully! Please log in." 
                } 
              })}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      

      {/* PROTECTED ROUTES */}
      <Route
        path="/"
        element={user ? <MainLayout /> : <Navigate to="/login" state={{ from: location }} replace />}
      >
        <Route index element={<Feed />} />

        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:id" element={<ProfilePage />} />

        <Route path="post/:id" element={<PostDetailsPage />} />
        
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:id" element={<ChatPage />} />
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="create" element={<CreatePostPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      

      {/* 404 CATCH ALL */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
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
