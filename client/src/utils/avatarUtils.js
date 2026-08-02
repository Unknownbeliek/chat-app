// Dynamic background color generator based on username
export const getUsernameColor = (username, customColor = "") => {
  if (customColor) return customColor;
  if (!username) return "hsl(0, 0%, 70%)";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 75%, 65%)`; 
};

// Formats initials (e.g. "Raj Kumar" -> "RK", "Rajkumar" -> "RK")
export const getInitials = (name) => {
  if (!name) return "?";
  if (name === "Global Chat") return "🌍";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (name.length >= 2) {
    return name.slice(0, 2).toUpperCase();
  }
  return name.toUpperCase();
};

export const PRESET_AVATARS = [
  "/avatars/avatar01.jpg",
  "/avatars/avatar02.jpg",
  "/avatars/avatar03.jpg",
  "/avatars/avatar04.jpg",
  "/avatars/avatar05.jpg",
  "/avatars/avatar06.jpg",
  "/avatars/avatar07.jpg",
  "/avatars/avatar08.jpg",
  "/avatars/avatar09.jpg",
  "/avatars/avatar10.jpg",
  "/avatars/avatar11.jpg",
  "/avatars/avatar12.jpg",
  "/avatars/avatar13.avf",
  "/avatars/avatar14.jpg"
];
