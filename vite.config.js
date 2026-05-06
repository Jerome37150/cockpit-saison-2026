import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Sous-chemin GitHub Pages : https://jerome37150.github.io/cockpit-saison-2026/
export default defineConfig({
  base: '/cockpit-saison-2026/',
  plugins: [react()],
})
