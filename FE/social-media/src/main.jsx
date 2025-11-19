import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import "./styles/tokens.css";     //variables/tokens
import "./index.css";             //reset + base uses Inter
import "./styles/typography.css"; //TYPOGRAPHY utilities
import "./styles/utilities.css";  //COLORs utilities
import React from "react";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

//app entry,creates the React root n renders <App />.
