import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Library from "./pages/Library";
import RepoDetail from "./pages/RepoDetail";
import BlogDetail from "./pages/BlogDetail";
import QuizDetail from "./pages/QuizDetail";
import QuizAttempt from "./pages/QuizAttempt";
import NewRepo from "./pages/NewRepo";
import NewBlog from "./pages/NewBlog";
import NewQuiz from "./pages/NewQuiz";

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function LoggedOutOnly({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomeOrLanding />} />
        <Route path="/login" element={<LoggedOutOnly><Login /></LoggedOutOnly>} />
        <Route path="/register" element={<LoggedOutOnly><Register /></LoggedOutOnly>} />
        <Route path="/u/:username" element={<Profile />} />
        <Route path="/library" element={<Protected><Library /></Protected>} />
        <Route path="/repo/:id" element={<RepoDetail />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/quiz/:id" element={<QuizDetail />} />
        <Route path="/quiz/:id/attempt" element={<Protected><QuizAttempt /></Protected>} />
        <Route path="/new/repo" element={<Protected><NewRepo /></Protected>} />
        <Route path="/new/blog" element={<Protected><NewBlog /></Protected>} />
        <Route path="/new/quiz" element={<Protected><NewQuiz /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function HomeOrLanding() {
  const { user } = useAuth();
  return user ? <Home /> : <Landing />;
}