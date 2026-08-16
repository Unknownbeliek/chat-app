import React, { useState, useEffect } from 'react';
import { getUsernameColor, getInitials } from '../../utils/avatarUtils';

export default function Avatar({ name, customColor, avatarUrl, size = "md", isOnline = false, showBadge = false }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl, name]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg font-semibold",
    xl: "w-24 h-24 text-2xl font-bold"
  }[size] || "w-10 h-10 text-sm";

  const isBot = name?.toLowerCase() === 'pingbot';
  const finalAvatarUrl = avatarUrl || (isBot ? 'https://api.dicebear.com/7.x/bottts/svg?seed=PingBot' : '');
  const finalIsOnline = isBot ? true : isOnline;

  const color = getUsernameColor(name, customColor);
  const initials = getInitials(name);

  const hasImage = finalAvatarUrl && !imgError;

  return (
    <div className="relative inline-block flex-shrink-0">
      <div
        className={`${sizeClasses} rounded-full flex items-center justify-center font-bold text-white shadow-md overflow-hidden transition-transform duration-200 hover:scale-105`}
        style={{ backgroundColor: hasImage ? 'transparent' : color }}
      >
        {hasImage ? (
          <img
            src={finalAvatarUrl}
            alt={name || "Avatar"}
            className="w-full h-full object-cover rounded-full"
            onError={() => setImgError(true)}
          />
        ) : (
          initials
        )}
      </div>
      {showBadge && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#121020] z-10 ${
            finalIsOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-500"
          }`}
        />
      )}
    </div>
  );
}
