//import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
//import './App.css'
import Login from "./pages/auth/LogInPage"
import Signup from "./pages/auth/SignUpPage"
import Feed from "./pages/feed/FeedPage"

import { BrowserRouter, Routes, Route, Navigate , useNavigate} from "react-router-dom";

import MainLayout from './components/layout/MainLayout';


const Placeholder = ({ title }) => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-gray-400">{title}</h1>
    <p className="text-gray-500">This page is under construction.</p>
  </div>
);


function AppRouter() {
  //toplvl component

  const isAuthenticated = false;
  const navigate = useNavigate();

  //const [view, setView] = useState("login"); //default view

  return (

    
      <Routes>
        {/* PUBLIC ROUTES (No Layout) */}
        <Route path="/login" element={<Login 
            onSwitch={() => navigate("/signup")} 
            onForgot={() => alert("Forgot password clicked")}
          />} />
        <Route path="/signup" element={
          <Signup 
            onSwitch={() => navigate("/login")} 
            onBack={() => navigate("/login")} 
          />
        }  />



        {/*PREVIEW ROUTE*/}
        <Route path="/preview" element={<MainLayout />}>
        <Route index element={<Feed />} />
      </Route>
      {/*PREVIEW ROUTE*/}




        {/* PROTECTED APP ROUTES (Wrapped in MainLayout) */}
        <Route 
          path="/" 
          element={isAuthenticated ? <MainLayout /> : <Navigate to="/login"  replace />}
        >
          {/* The <Outlet /> in MainLayout renders these children: */}
          <Route index element={<Feed />} /> 
          
          <Route path="profile" element={<Placeholder title="Profile Page" />} />
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
  
  
  // const [count, setCount] = useState(0)

  // return (
  //   <>
  //     <div>
  //       <a href="https://vite.dev" target="_blank">
  //         <img src={viteLogo} className="logo" alt="Vite logo" />
  //       </a>
  //       <a href="https://react.dev" target="_blank">
  //         <img src={reactLogo} className="logo react" alt="React logo" />
  //       </a>
  //     </div>
  //     <h1>Vite + React</h1>
  //     <div className="card">
  //       <button onClick={() => setCount((count) => count + 1)}>
  //         count is {count}
  //       </button>
  //       <p>
  //         Edit <code>src/App.jsx</code> and save to test HMR
  //       </p>
  //     </div>
  //     <p className="read-the-docs">
  //       Click on the Vite and React logos to learn more
  //     </p>
  //   </>
  // )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}