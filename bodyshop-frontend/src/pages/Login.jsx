import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bs-login-page">
      <div className="bs-login-card">

        <div className="bs-login-header">
          <h1 className="bs-login-title">Body Shop Tracker</h1>
          <p className="bs-login-subtitle">
            Sign in to continue
          </p>
        </div>

        <form className="bs-login-form" onSubmit={handleLogin}>

          {error && (
            <div className="bs-login-error">
              {error}
            </div>
          )}

          <div className="bs-login-field">
            <label className="bs-login-label">
              Email
            </label>

            <input
              type="email"
              className="bs-login-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="bs-login-field">
            <label className="bs-login-label">
              Password
            </label>

            <input
              type="password"
              className="bs-login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="bs-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;