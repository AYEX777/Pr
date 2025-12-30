import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import "./index.css";
import "./styles/dark-mode-fix.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Capacitor } from "@capacitor/core";

// Initialize Capacitor for mobile platforms
if (Capacitor.isNativePlatform()) {
  // Configuration spécifique pour les plateformes natives
  console.log("📱 Application PRISK en mode natif");
}

// Initialize dark mode before React mounts (prevents flash)
const darkMode = localStorage.getItem("darkMode") === "true";
if (darkMode) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

// Agent log removed - not needed for production
createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
  