import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home/Home";
import Sign from "./pages/Sign/Sign";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout/DashboardLayout";
import RoleSwitch from "./components/routing/RoleSwitch";
import ComingSoon from "./components/routing/ComingSoon";
import MyStadiums from "./pages/MyStadiums/MyStadiums";
import BrowseStadiums from "./pages/BrowseStadiums/BrowseStadiums";
import AddStadium from "./pages/AddStadium/AddStadium";
import StadiumDetail from "./pages/StadiumDetail/StadiumDetail";
import IncomingReservations from "./pages/IncomingReservations/IncomingReservations";
import ErrorPage from "./pages/Error/ErrorPage";

function App() {
  const [isSignIn, setIsSignIn] = useState<boolean | null>(false);
  return (
    <Routes>
      <Route index element={<Home setIsSignIn={setIsSignIn} />} />
      <Route
        path="/sign"
        element={<Sign isSignIn={isSignIn} setIsSignIn={setIsSignIn} />}
      />
      <Route
        path="/dashboard"
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
              organizer={<BrowseStadiums />}
            />
          }
        />
        <Route
          path="stadiums/new"
          element={
            <RoleSwitch
              owner={<AddStadium />}
              organizer={<Navigate to="/dashboard" replace />}
            />
          }
        />
        <Route path="stadiums/:id" element={<StadiumDetail />} />
        <Route
          path="reservations"
          element={
            <RoleSwitch
              owner={<IncomingReservations />}
              organizer={<ComingSoon title="My Reservations" />}
            />
          }
        />
        <Route path="messages" element={<ComingSoon title="Messages" />} />
        {/* unknown /dashboard/* path → 404 (otherwise renders a blank layout) */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
      <Route
        path="/403"
        element={
          <ErrorPage
            code="403"
            title="Access denied"
            message="You don't have permission to view this page."
          />
        }
      />
      <Route
        path="*"
        element={
          <ErrorPage
            code="404"
            title="Page not found"
            message="The page you're looking for doesn't exist or has moved."
          />
        }
      />
    </Routes>
  );
}

export default App;
