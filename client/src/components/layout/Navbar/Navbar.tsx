import "./Navbar.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { MenuIcon, XIcon } from "../../ui/icons";
import type { Dispatch, SetStateAction } from "react";

type NavbarProps = {
  setIsSignIn: Dispatch<SetStateAction<boolean | null>>;
};

function Navbar({ setIsSignIn }: NavbarProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMenu() {
    setMobileOpen(false);
  }

  // While the mobile menu is open: lock body scroll (the fixed scrim alone
  // doesn't stop iOS momentum scroll) and let Escape close it.
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  function handleNavigate(dest: string) {
    closeMenu();
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
          <a href="#hero" onClick={closeMenu}>
            StadiumHub
          </a>
        </div>

        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="nav-collapse-menu"
        >
          {mobileOpen ? <XIcon size={26} /> : <MenuIcon size={26} />}
        </button>

        <div
          id="nav-collapse-menu"
          className={`nav-collapse ${mobileOpen ? "is-open" : ""}`}
        >
          <div className="nav-links">
            <a href="#howItWork" onClick={closeMenu}>
              How it works
            </a>
            <a href="#builtFor" onClick={closeMenu}>
              For you
            </a>
          </div>
          {isAuthenticated ? (
            <div className="nav-buttons-logout">
              <span className="nav-username">{user?.username}</span>
              <button
                className="green-button"
                onClick={() => {
                  closeMenu();
                  navigate("/dashboard");
                }}
              >
                Go to Dashboard <i className="fa-solid fa-arrow-right"></i>
              </button>
              <button
                className="black-button"
                onClick={() => {
                  closeMenu();
                  logout();
                }}
              >
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
        </div>
      </nav>
      {mobileOpen && <div className="nav-scrim" onClick={closeMenu} />}
    </>
  );
}
export default Navbar;
