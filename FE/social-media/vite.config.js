import { defineConfig } from 'vite'
//import tailwindcss from '@tailwindcss/vite'

import react from '@vitejs/plugin-react'
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()
  //,tailwindcss(),
  ],

  resolve: {
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },

  server: {
    
    proxy: {
      '/api': {
        target: import.meta.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        //rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/uploads': { //proxy for static img  by be
        target: import.meta.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
        
      }
    }
  }
})
