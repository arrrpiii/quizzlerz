import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  async function login(usernameOrEmail, password) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { login: usernameOrEmail, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(username, email, password) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { username, email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  // On mount, if we have a token but no user (refreshed page), fetch /me.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      api.get("/me").then(({ data }) => {
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data);
      }).catch(() => logout());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}