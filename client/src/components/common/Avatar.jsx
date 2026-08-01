import React from 'react';
import { getUsernameColor, getInitials } from '../../utils/avatarUtils';

export default function Avatar({ name, customColor, size = "md", isOnline = false, showBadge = false }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg font-semibold",
    xl: "w-24 h-24 text-2xl font-bold"
  }[size] || "w-10 h-10 text-sm";

  const color = getUsernameColor(name, customColor);
  const initials = getInitials(name);

  return (
    <div className="relative inline-block flex-shrink-0">
      <div
        className={`${sizeClasses} rounded-full flex items-center justify-center font-bold text-white shadow-md transition-transform duration-200 hover:scale-105`}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {showBadge && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121020] ${
            isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-500"
          }`}
        />
      )}
    </div>
  );
}
