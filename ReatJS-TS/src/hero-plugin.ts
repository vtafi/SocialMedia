import { heroui } from "@heroui/react";

// Export heroui() — returns { handler, config } (Tailwind v3 plugin format).
// Tailwind v4 detects the "handler" property and spreads both handler AND
// config.theme.extend (colors, animations, keyframes) automatically.
// This is the pattern recommended by HeroUI official docs:
// https://www.heroui.com/docs/frameworks/vite
export default heroui();
