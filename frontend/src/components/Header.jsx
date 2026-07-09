import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">Quizzlerz</Link>
        <nav className="nav">
          {user ? (
            <>
              <Link to="/new/blog">+ Blog</Link>
              <Link to="/new/repo">+ Repo</Link>
              <Link to="/new/quiz">+ Quiz</Link>
              <Link to="/library">My Library</Link>
              <Link to={`/u/${user.username}`}>{user.username}</Link>
              <button className="btn-secondary" onClick={() => { logout(); nav("/"); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}