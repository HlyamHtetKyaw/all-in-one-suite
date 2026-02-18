import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}],
        ],
      },
    }),
  ],
     optimizeDeps: {
       exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
     },
     server: {
       headers: {
         'Cross-Origin-Opener-Policy': 'same-origin',      
         'Cross-Origin-Embedder-Policy': 'require-corp', 
       },
     },
})