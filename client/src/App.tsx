import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Sign from "./pages/Sign/Sign";
import Landing from "./pages/Landing/Landing";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/Sign" element={<Sign />} />
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
