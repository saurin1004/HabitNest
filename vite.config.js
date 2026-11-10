import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://saurin1004.github.io/HabitNest/
export default defineConfig({
  base: "/HabitNest/",
  // Firebase is split into its own lazily-loaded chunk, used only for signed-in users.
  build: { chunkSizeWarningLimit: 900 },
  plugins: [react()],
  test: {
    environment: "node",
  },
});
