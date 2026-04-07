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
          background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h2 {
          color: #1a2a6c;
          margin-bottom: 0.5rem;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .login-header p {
          color: #666;
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
          color: #333;
        }

        .input-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
          transition: border-color 0.3s;
        }

        .input-group input:focus {
          outline: none;
          border-color: #b21f1f;
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
          color: #666;
          font-size: 0.75rem;
          cursor: pointer;
          font-weight: 600;
        }

        .error-message {
          background: #ffe6e6;
          color: #b21f1f;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          border: 1px solid #ffcccc;
        }

        .login-button {
          width: 100%;
          padding: 0.85rem;
          background: #1a2a6c;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
        }

        .login-button:hover {
          background: #0d1a4d;
        }

        .login-button:active {
          transform: scale(0.98);
        }

        .login-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.75rem;
          color: #888;
        }
      ` }} />
    </div>
  );
}

export default Login;
