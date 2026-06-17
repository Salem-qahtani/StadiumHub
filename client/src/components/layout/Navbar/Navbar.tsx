import "./Navbar.css";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import type { Dispatch, SetStateAction } from "react";

type NavbarProps = {
  setIsSignIn: Dispatch<SetStateAction<boolean | null>>;
};

function Navbar({ setIsSignIn }: NavbarProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  function handleNavigate(dest: string) {
    if (dest === "sign-in") {
      setIsSignIn(true);
      navigate("/sign");
    } else {
      setIsSignIn(false);
      navigate("/sign");
    }
  }
  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <a href="#hero">⚽ PitchSide</a>
        </div>
        {isAuthenticated ? (
          <div className="nav-links home">
            <NavLink to="/landing" className="home-link">
              Home Page
            </NavLink>
          </div>
        ) : (
          <div className="nav-links">
            <a href="#howItWork">How it works</a>
            <a href="#builtFor">For you</a>
            <a href="#hero">About</a>
          </div>
        )}
        {isAuthenticated ? (
          <div className="nav-buttons-logout">
            <h3>{user?.username}</h3>
            <button className="signout-button" onClick={logout}>
              Log out
            </button>
          </div>
        ) : (
          <div className="nav-buttons">
            <button
              className="black-button"
              onClick={() => {
                handleNavigate("sign-in");
              }}
            >
              Log in
            </button>
            <button
              className="green-button"
              onClick={() => {
                handleNavigate("sign-up");
              }}
            >
              Sign Up <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
export default Navbar;
