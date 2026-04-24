import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <motion.img
      src={logo}
      alt="Meraki Care"
      className={`h-10 w-auto object-contain ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    />
  );
}
