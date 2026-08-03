"use client";
import React from "react";
import { motion } from "motion/react";

export default function MicIcon({ isMuted = false, className = "w-5 h-5" }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <motion.path
        d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"
        animate={{ y: isMuted ? 0 : [0, -1, 1, 0] }}
        transition={{ repeat: isMuted ? 0 : Infinity, duration: 2, ease: "easeInOut" }}
      />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      {isMuted && (
        <motion.line
          x1="2"
          y1="2"
          x2="22"
          y2="22"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.25 }}
          stroke="currentColor"
          strokeWidth="2.5"
        />
      )}
    </motion.svg>
  );
}
