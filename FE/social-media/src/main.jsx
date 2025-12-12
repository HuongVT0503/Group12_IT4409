import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
//import "./styles/tokens.css";     //variables/tokens
import "./index.css";             //reset + base uses Inter
//import "./styles/typography.css"; //TYPOGRAPHY utilities
//import "./styles/utilities.css";  //COLORs utilities
//import React from "react";

import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)

//app entry,creates the React root n renders <App />.
