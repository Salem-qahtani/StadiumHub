import { useAuth } from "../../contexts/AuthContext";

function Landing() {
  const { user } = useAuth();
  return (
    <>
      <h1>Hello {user?.username}</h1>
      {}
    </>
  );
}

export default Landing;
