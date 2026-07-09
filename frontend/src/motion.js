// Reusable motion variants and helpers so animations stay consistent.
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: "easeOut" },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: 0.2 },
};

// Stagger children: pass an index in.
export function stagger(i, base = 0.04) {
  return { transition: { duration: 0.3, delay: i * base, ease: "easeOut" } };
}

// Card hover/tap.
export const cardHover = {
  whileHover: { y: -3, transition: { duration: 0.15 } },
  whileTap:   { y: 0, transition: { duration: 0.1 } },
};

// Like button pulse.
export const likePulse = {
  whileTap: { scale: 0.85, transition: { duration: 0.08 } },
  animate:  { scale: 1 },
};

// Count swap when toggling.
export const countSwap = {
  initial: { y: -6, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit:    { y: 6, opacity: 0 },
  transition: { duration: 0.18 },
};