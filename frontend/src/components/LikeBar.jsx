import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api";
import { likePulse, countSwap } from "../motion";

function Count({ value }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={value}
        className="count"
        initial={countSwap.initial}
        animate={countSwap.animate}
        exit={countSwap.exit}
        transition={countSwap.transition}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

export default function LikeBar({ kind, id, initialLiked, initialDisliked, likesCount, dislikesCount, onChange }) {
  const [liked, setLiked] = useState(initialLiked);
  const [disliked, setDisliked] = useState(initialDisliked);
  const [lc, setLc] = useState(likesCount);
  const [dc, setDc] = useState(dislikesCount);

  async function toggle(which) {
    try {
      const { data } = await api.post(`/posts/${kind}/${id}/${which}`);
      if (which === "like") {
        setLiked(data.liked);
        setLc(data.likes_count);
        if (data.liked && disliked) {
          setDisliked(false);
          setDc((n) => Math.max(0, n - 1));
        }
      } else {
        setDisliked(data.disliked);
        setDc(data.dislikes_count);
        if (data.disliked && liked) {
          setLiked(false);
          setLc((n) => Math.max(0, n - 1));
        }
      }
      onChange?.();
    } catch (e) {
      if (e.response?.status === 401) window.location.href = "/login";
    }
  }

  return (
    <div className="likebar">
      <motion.button
        className={"like" + (liked ? " active" : "")}
        onClick={() => toggle("like")}
        whileTap={likePulse.whileTap}
        animate={likePulse.animate}
      >
        ▲ Like
      </motion.button>
      <Count value={lc} />
      <motion.button
        className={"dislike" + (disliked ? " active" : "")}
        onClick={() => toggle("dislike")}
        whileTap={likePulse.whileTap}
        animate={likePulse.animate}
      >
        ▼ Dislike
      </motion.button>
      <Count value={dc} />
    </div>
  );
}