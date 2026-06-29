import "./Sign.css";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import Footer from "../../components/layout/Footer/Footer";
import { useState, type Dispatch, type SetStateAction } from "react";

type SignProps = {
  isSignIn: boolean | null;
  setIsSignIn: Dispatch<SetStateAction<boolean | null>>;
};

function Sign({ isSignIn, setIsSignIn }: SignProps) {
  const [isSliding, setIsSliding] = useState<boolean>(false);

  function handleSlide() {
    if (!isSliding) {
      setIsSignIn(!isSignIn);
      setIsSliding(true);
      setTimeout(() => {
        setIsSliding(false);
      }, 800);
    }
  }
  return (
    <div className="Sign-page">
      <title>Sign</title>
      <div className="sign-body">
        <h3 className="forms-header">StadiumHub</h3>
        <div className="forms-container">
          <div className={`cover-${isSignIn ? "SignUp" : "SignIn"} cover`}>
            {isSignIn ? (
              <>
                <h1 className="cover-header">Hello Friend !</h1>
                <p className="cover-body">
                  Register with your details and start booking pitches,
                  organizing matches, and managing your stadium.
                </p>
              </>
            ) : (
              <>
                <h1 className="cover-header">Welcome Back !</h1>
                <p className="cover-body">
                  To keep connected with the league please log in with your
                  personal info.
                </p>
              </>
            )}
            <button onClick={handleSlide} className="slide-button">
              {isSignIn ? "Register Now" : "Log In Now"}
            </button>
          </div>
          <SignInForm
            isSignIn={isSignIn}
            isSliding={isSliding}
            onToggle={handleSlide}
          />
          <SignUpForm
            isSignIn={isSignIn}
            isSliding={isSliding}
            onToggle={handleSlide}
          />
        </div>
      </div>
      <Footer bg="rgba(223, 234, 221, 0.645)" variant="light" />
    </div>
  );
}

export default Sign;
