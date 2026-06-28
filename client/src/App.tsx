import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home/Home";
import Sign from "./pages/Sign/Sign";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout/DashboardLayout";
import RoleSwitch from "./components/routing/RoleSwitch";
import ComingSoon from "./components/routing/ComingSoon";
import MyStadiums from "./pages/MyStadiums/MyStadiums";
import AddStadium from "./pages/AddStadium/AddStadium";
import StadiumDetail from "./pages/StadiumDetail/StadiumDetail";

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
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <RoleSwitch
              owner={<MyStadiums />}
              organizer={<ComingSoon title="Browse Stadiums" />}
            />
          }
        />
        <Route
          path="stadiums/new"
          element={
            <RoleSwitch
              owner={<AddStadium />}
              organizer={<Navigate to="/landing" replace />}
            />
          }
        />
        <Route path="stadiums/:id" element={<StadiumDetail />} />
        <Route path="reservations" element={<ComingSoon title="Reservations" />} />
        <Route path="messages" element={<ComingSoon title="Messages" />} />
      </Route>
    </Routes>
  );
}

export default App;
