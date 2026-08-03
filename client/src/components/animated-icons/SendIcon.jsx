"use client";
import React from "react";
import { motion } from "motion/react";

export default function SendIcon({ className = "w-5 h-5" }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      whileHover={{ x: [0, 3, -1, 0], y: [0, -3, 1, 0], scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </motion.svg>
  );
}
