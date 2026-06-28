import "./HeroSection.css";
import DetailText from "../DetailText/DetailText";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import type { Dispatch, SetStateAction } from "react";

type HeroSectionProps = {
  setIsSignIn: Dispatch<SetStateAction<boolean | null>>;
};

function HeroSection({ setIsSignIn }: HeroSectionProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  function handleNavigate(dest: string) {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
    if (dest === "sign-in") {
      setIsSignIn(true);
    } else {
      setIsSignIn(false);
    }
    navigate("/sign");
  }
  return (
    <div className="hero-section" id="hero">
      <DetailText text="ALWAYS AVAILABLE" color="white" />
      <hr className="my-hr"></hr>
      <h1 className="hero-text">
        <span className="book-yor">Book Your</span>{" "}
        <span className="perfect">Perfect</span>{" "}
        <span className="pitch">Pitch.</span>
      </h1>
      <div className="hero-body-container">
        <p className="hero-body">
          The reservation platform connecting stadium owners with match
          organizers. From five-a-side cages to full-size pitches find it, book
          it, play.
        </p>
        <div className="hero-buttons-container">
          <div className="hero-buttons">
            <button
              className="green-button"
              onClick={() => {
                handleNavigate("sign-up");
              }}
            >
              FIND A STADIUM <i className="fa-solid fa-arrow-right"></i>
            </button>
            <button
              className="black-button"
              onClick={() => {
                handleNavigate("sign-up");
              }}
            >
              LIST YOUR STADIUM
            </button>
          </div>
          {!isAuthenticated && (
            <p className="sign-in-p">
              Already have an account?
              <a
                className="sign-in-a"
                onClick={() => {
                  handleNavigate("sign-in");
                }}
              >
                {" "}
                Sign in
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
