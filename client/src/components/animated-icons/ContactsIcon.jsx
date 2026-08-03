"use client";
import React from "react";
import { motion } from "motion/react";

export default function ContactsIcon({ className = "w-5 h-5" }) {
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
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        whileHover={{ x: -1 }}
      />
      <motion.circle cx="9" cy="7" r="4" whileHover={{ scale: 1.1 }} />
      <motion.path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        animate={{ x: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </motion.svg>
  );
}
