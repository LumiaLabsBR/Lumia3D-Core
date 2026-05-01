import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // base relativa: WebView2 carrega via file://, paths absolutos como /assets/
  // resolvem para file:///C:/assets/ e quebram. './' resolve relativo ao index.html.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    open: false, // Photino abre a janela; não abrir browser separado
  },
  build: {
    // Output vai para wwwroot do projeto C# (copiado pelo MSBuild para o executável)
    outDir: path.resolve(__dirname, '../Lumia3DCore/wwwroot'),
    emptyOutDir: true,
  },
});
