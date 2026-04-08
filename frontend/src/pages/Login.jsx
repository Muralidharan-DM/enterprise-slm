import React, { useState } from "react";
import API from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("users/login/", {
        email,
        password
      });

      localStorage.setItem("user", JSON.stringify(res.data));
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please use @decisionminds.com email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Decision Minds" style={{ width: '80px', marginBottom: '1rem' }} />
          <h2>Decision Minds</h2>
          <p>Enterprise SLM Platform</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Work Email</label>
            <input
              type="email"
              placeholder="name@decisionminds.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <p>Restricted to @decisionminds.com domains.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-app);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .login-card {
          background: var(--bg-panel);
          padding: 3rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-color);
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h2 {
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .login-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .input-group input {
          width: 100%;
          padding: 0.75rem;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          transition: border-color 0.3s;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--accent-primary);
        }

        .password-input {
          position: relative;
        }

        .toggle-password {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.75rem;
          cursor: pointer;
          font-weight: 600;
        }
        
        .toggle-password:hover {
          color: var(--text-primary);
        }

        .error-message {
          background: rgba(216, 76, 53, 0.1);
          color: var(--accent-danger);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          border: 1px solid rgba(216, 76, 53, 0.3);
        }

        .login-button {
          width: 100%;
          padding: 0.85rem;
          background: var(--accent-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }

        .login-button:hover {
          background: var(--accent-primary-hover);
        }

        .login-button:active {
          transform: scale(0.98);
        }

        .login-button:disabled {
          background: var(--bg-panel-hover);
          color: var(--text-secondary);
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
      ` }} />
    </div>
  );
}

export default Login;
