import { motion } from "framer-motion";

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <div
            key={t.key}
            role="tab"
            aria-selected={isActive}
            className={"tab" + (isActive ? " active" : "")}
            onClick={() => onChange(t.key)}
          >
            {t.label}
            {isActive && (
              <motion.div
                className="tab-underline"
                layoutId="tab-underline"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}