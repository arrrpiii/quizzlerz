import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import MotionContainer from "../components/MotionContainer";
import { errorMessage } from "../errors";

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [loginField, setLoginField] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(loginField.trim(), password);
      nav("/");
    } catch (e) {
      setErr(errorMessage(e, "login failed"));
    }
  }

  return (
    <MotionContainer style={{ maxWidth: 480 }}>
      <h1>Login</h1>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Username or email</label>
          <input value={loginField} onChange={(e) => setLoginField(e.target.value)} autoFocus />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>{loading ? "..." : "Login"}</button>
        {err && <div className="form-error">{err}</div>}
      </form>
      <p className="muted mt-1">No account? <Link to="/register">Register</Link></p>
    </MotionContainer>
  );
}