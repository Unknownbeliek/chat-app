"use client";
import React from "react";
import { motion } from "motion/react";

export default function VideoIcon({ isMuted = false, className = "w-5 h-5" }) {
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
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <motion.path
        d="M22 8.5l-6 4 6 4v-8z"
        animate={{ x: isMuted ? 0 : [0, 1.5, 0] }}
        transition={{ repeat: isMuted ? 0 : Infinity, duration: 1.5, ease: "easeInOut" }}
      />
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
