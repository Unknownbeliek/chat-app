"use client";
import React from "react";
import { motion } from "motion/react";

export default function ScrollBottomIcon({ className = "w-5 h-5" }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      whileHover={{ y: [0, 4, 0] }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
    >
      <path d="M6 9l6 6 6-6" />
    </motion.svg>
  );
}
