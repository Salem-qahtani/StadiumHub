import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home/Home";
import Sign from "./pages/Sign/Sign";
import Landing from "./pages/Landing/Landing";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
  const [isSignIn, setIsSignIn] = useState<boolean | null>(false);
  return (
    <Routes>
      <Route index element={<Home setIsSignIn={setIsSignIn} />} />
      <Route
        path="/Sign"
        element={<Sign isSignIn={isSignIn} setIsSignIn={setIsSignIn} />}
      />
      <Route
        path="/landing"
        element={
          <ProtectedRoute>
            <Landing />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
