import { motion } from "framer-motion";
import { fadeUp } from "../motion";

// Drop-in wrapper that fades + lifts its children on mount.
export default function MotionContainer({ children, className = "", style }) {
  return (
    <motion.div
      className={"container " + className}
      style={style}
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      transition={fadeUp.transition}
    >
      {children}
    </motion.div>
  );
}