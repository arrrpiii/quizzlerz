import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import MotionContainer from "../components/MotionContainer";
import { errorMessage } from "../errors";

export default function Register() {
  const { register, loading } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await register(username.trim(), email.trim(), password);
      nav("/");
    } catch (e) {
      setErr(errorMessage(e, "registration failed"));
    }
  }

  return (
    <MotionContainer style={{ maxWidth: 480 }}>
      <h1>Register</h1>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Username (3-32 chars)</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Password (min 6)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>{loading ? "..." : "Register"}</button>
        {err && <div className="form-error">{err}</div>}
      </form>
      <p className="muted mt-1">Have an account? <Link to="/login">Login</Link></p>
    </MotionContainer>
  );
}