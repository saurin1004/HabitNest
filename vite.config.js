import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://saurin1004.github.io/HabitNest/
export default defineConfig({
  base: "/HabitNest/",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
