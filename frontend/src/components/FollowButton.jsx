import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import api from "../api";

export default function FollowButton({ username, initiallyFollowing, onChange }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initiallyFollowing);

  // Keep the button label in sync if the parent refetches and brings a new
  // is_following value (e.g. profile refetch from elsewhere).
  useEffect(() => { setFollowing(initiallyFollowing); }, [initiallyFollowing, username]);

  if (!user || user.username === username) return null;

  async function toggle() {
    try {
      const { data } = await api.post(`/users/${username}/follow`);
      setFollowing(data.following);
      onChange?.(data.following);
    } catch (e) {
      if (e.response?.status === 401) window.location.href = "/login";
    }
  }

  return (
    <button className={following ? "btn-ghost" : ""} onClick={toggle}>
      {following ? "Following" : "Follow"}
    </button>
  );
}