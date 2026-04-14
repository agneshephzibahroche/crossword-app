import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Letterbeat",
    short_name: "Letterbeat",
    description:
      "A lively daily crossword game with fresh 5x5 puzzles and archived play.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff4df",
    theme_color: "#ff6b6b",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
