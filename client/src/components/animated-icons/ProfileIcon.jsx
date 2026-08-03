"use client";
import React from "react";
import { motion } from "motion/react";

export default function ProfileIcon({ className = "w-5 h-5" }) {
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
      whileHover={{ scale: 1.15, y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <motion.path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      />
      <motion.circle
        cx="12"
        cy="7"
        r="4"
        whileHover={{ scale: 1.15 }}
      />
    </motion.svg>
  );
}
