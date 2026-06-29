import "./SignInForm.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

type SignInFormProps = {
  isSignIn: boolean | null;
  isSliding: boolean;
  onToggle: () => void;
};

type SignInErrors = {
  username?: string;
  password?: string;
  submit?: string;
};
type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

function SignInForm({ isSignIn, isSliding, onToggle }: SignInFormProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<SignInErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function validate(): SignInErrors {
    const errs: SignInErrors = {};
    if (!username.trim()) {
      errs.username = "Enter your username.";
    }
    if (!password.trim()) {
      errs.password = "Enter your password.";
    }
    return errs;
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setLoading(true);
      try {
        const response = await api.post("/auth/signin", { username, password });
        const { user, token } = response.data;
        login(user, token);
        resetForm();
        navigate("/dashboard");
      } catch (err) {
        const error = err as ApiError;
        setErrors({ submit: error.response?.data?.error || "sign in failed" });
      } finally {
        setLoading(false);
      }
    }
  }
  function resetForm() {
    setPassword("");
    setUsername("");
    setErrors({});
  }
  useEffect(() => {
    if (isSliding) resetForm();
  }, [isSliding]);

  return (
    <form
      className={`form ${isSignIn ? "form-show" : "form-hide"} ${isSliding ? "sliding" : ""}`}
      onSubmit={handleSubmit}
    >
      <h3 className="form-header">Sign In</h3>
      <input
        type="text"
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
        value={username}
        disabled={loading}
      />
      {errors.username && <span className="errors">{errors.username}</span>}
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        disabled={loading}
      />
      {errors.password && <span className="errors">{errors.password}</span>}
      {errors.submit && <span className="errors">{errors.submit}</span>}
      <button className="form-button" disabled={loading}>
        {loading ? "SIGNING IN..." : "SIGN IN"}
      </button>
      <p className="form-toggle">
        Don't have an account?{" "}
        <button type="button" className="form-toggle-btn" onClick={onToggle}>
          Sign up
        </button>
      </p>
    </form>
  );
}

export default SignInForm;
