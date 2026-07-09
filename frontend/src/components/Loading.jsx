import { motion } from "framer-motion";

// Animated "Loading…" with a soft pulsing text and a gentle fade-in.
export default function Loading({ text = "Loading…" }) {
  return (
    <motion.div
      className="loading-state"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <motion.span
        className="loading-text"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {text}
      </motion.span>
    </motion.div>
  );
}