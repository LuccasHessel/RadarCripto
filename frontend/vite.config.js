import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Nesta versao (Projeto 2) o Front-end fala diretamente com cada
// microsservico atraves de URLs absolutas configuraveis por variavel
// de ambiente (VITE_AUTH_SERVICE_URL, VITE_RESOURCE_SERVICE_URL,
// VITE_NOTIFICATION_WS_URL). O proxy do Projeto 1 nao e mais necessario.
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'esbuild',
  },
})
