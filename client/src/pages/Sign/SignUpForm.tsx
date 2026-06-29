import "./SignUpForm.css";
import { useState, useEffect, type MouseEvent } from "react";
import PasswordStrength from "./PasswordStrength";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

type SignUpFormProps = {
  isSignIn: boolean | null;
  isSliding: boolean;
  onToggle: () => void;
};

type SignUpErrors = {
  name?: string;
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

function SignUpForm({ isSignIn, isSliding, onToggle }: SignUpFormProps) {
  const location = useLocation();
  const preSelectedRole = location.state?.role ?? "organizer";
  const [role, setRole] = useState<string>(preSelectedRole);
  const [ownerChosen, setOwnerChosen] = useState<boolean>(
    preSelectedRole === "owner",
  );
  const [organizerChosen, setOrganizerChosen] = useState<boolean>(
    preSelectedRole === "organizer",
  );
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [strength, setStrength] = useState<string>("-");
  const [conf, setConf] = useState<string>("");
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();

  const navigate = useNavigate();

  function choseRole(element: MouseEvent<HTMLDivElement>) {
    const id = String((element.target as HTMLElement).id);
    if (
      !(
        (ownerChosen && id === "owner") ||
        (organizerChosen && id === "organizer")
      )
    ) {
      setRole(id);
      setOwnerChosen(!ownerChosen);
      setOrganizerChosen(!organizerChosen);
    }
  }
  function validate(): SignUpErrors {
    const errs: SignUpErrors = {};
    if (!name.trim()) {
      errs.name = "Name is required.";
    }
    if (!username.trim()) {
      errs.username = "Username is required.";
    }
    if (!password.trim()) {
      errs.password = "Password is required.";
    }
    if (strength === "Weak") {
      errs.password = "Password is Weak.";
    } else if (conf !== password) {
      errs.password = "Passwords do not match.";
    }

    return errs;
  }
  async function handleForm(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setLoading(true);
      try {
        const response = await api.post("/auth/signup", {
          name,
          username,
          password,
          role,
        });
        const { user, token } = response.data;
        resetForm();
        login(user, token);
        navigate("/dashboard");
      } catch (err) {
        const error = err as ApiError;
        setErrors({ submit: error.response?.data?.error || "Signup failed" });
      } finally {
        setLoading(false);
      }
    }
  }
  function resetForm() {
    setName("");
    setPassword("");
    setConf("");
    setUsername("");
    setStrength("-");
    setErrors({});
  }
  useEffect(() => {
    if (isSliding) resetForm();
  }, [isSliding]);
  return (
    <form
      onSubmit={handleForm}
      className={`form ${isSignIn ? "form-hide" : "form-show"} ${isSliding ? "sliding" : ""}`}
    >
      <h3 className="form-header">Create An Account</h3>
      <div className="roles-container">
        <div
          className={ownerChosen ? "chosen-role" : "non-chosen-role"}
          onClick={choseRole}
          id="owner"
        >
          Stadium Owner
        </div>
        <div
          className={organizerChosen ? "chosen-role" : "non-chosen-role"}
          onClick={choseRole}
          id="organizer"
        >
          Match Organizer
        </div>
      </div>
      <input
        type="text"
        placeholder="Full Name"
        onChange={(element) => {
          setName(element.target.value);
        }}
        value={name}
        disabled={loading}
      />
      {errors.name && <span className="errors">{errors.name}</span>}
      <input
        type="text"
        placeholder="Username"
        onChange={(element) => {
          setUsername(element.target.value);
        }}
        value={username}
        disabled={loading}
      />
      {errors.username && <span className="errors">{errors.username}</span>}
      <PasswordStrength
        onChange={setPassword}
        password={password}
        strength={strength}
        setStrength={setStrength}
        disabled={loading}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        onChange={(element) => {
          setConf(element.target.value);
        }}
        value={conf}
        disabled={loading}
      />
      {errors.password && <span className="errors">{errors.password}</span>}
      {errors.submit && <span className="errors">{errors.submit}</span>}
      <button className="form-button" disabled={loading}>
        {loading ? "SIGNING UP..." : "SIGN UP"}
      </button>
      <p className="form-toggle">
        Already have an account?{" "}
        <button type="button" className="form-toggle-btn" onClick={onToggle}>
          Sign in
        </button>
      </p>
    </form>
  );
}

export default SignUpForm;
