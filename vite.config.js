import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Это разделит код на два файла: ваш код и библиотеки (React, etc.)
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
    // Увеличим лимит предупреждения, но лучше проблему решить
    chunkSizeWarningLimit: 1000,
  },
});
