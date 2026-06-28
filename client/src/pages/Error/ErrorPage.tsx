import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button/Button";
import "./ErrorPage.css";

type ErrorPageProps = {
  code: string;
  title: string;
  message: string;
};

// Standalone error screen, intentionally outside the dashboard layout so it
// reads as an error page (used for 403 / 404).
function ErrorPage({ code, title, message }: ErrorPageProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <main className="error-page">
      <div className="error-content">
        <span className="error-code">{code}</span>
        <h1 className="error-title">{title}</h1>
        <p className="error-message">{message}</p>
        <Button onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}>
          {isAuthenticated ? "Back to dashboard" : "Go home"}
        </Button>
      </div>
    </main>
  );
}

export default ErrorPage;
