import Navbar from "../../components/layout/Navbar/Navbar";
import HeroSection from "../../components/Home/HeroSection/HeroSection";
import HowItWork from "../../components/Home/HowItWork/HowItWork";
import BuiltFor from "../../components/Home/BuiltFor/BuiltFor";
import Footer from "../../components/layout/Footer/Footer";
import type { Dispatch, SetStateAction } from "react";

type HomeProps = {
  setIsSignIn: Dispatch<SetStateAction<boolean | null>>;
};

function Home({ setIsSignIn }: HomeProps) {
  return (
    <div className="Home">
      <title>Home</title>
      <Navbar setIsSignIn={setIsSignIn} />
      <HeroSection setIsSignIn={setIsSignIn} />
      <HowItWork />
      <BuiltFor setIsSignIn={setIsSignIn} />
      <Footer bg="#000000" variant="dark" />
    </div>
  );
}

export default Home;
