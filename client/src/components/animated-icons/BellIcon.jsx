"use client";
import React from "react";
import { motion } from "motion/react";

export default function BellIcon({ className = "w-5 h-5" }) {
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
      whileHover={{ scale: 1.15, rotate: [0, -15, 15, -10, 10, 0] }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </motion.svg>
  );
}
