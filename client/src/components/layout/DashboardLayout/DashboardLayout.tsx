import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import {
  StadiumIcon,
  SearchIcon,
  TicketIcon,
  MessageIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
} from "../../ui/icons";
import Footer from "../Footer/Footer";
import "./DashboardLayout.css";

type NavItem = { to: string; label: string; icon: React.ReactNode; end?: boolean };

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOwner = user?.role === "owner";
  const isMessages = useLocation().pathname.startsWith("/dashboard/messages");

  const navItems: NavItem[] = [
    {
      to: "/dashboard",
      label: isOwner ? "My Stadiums" : "Browse Stadiums",
      icon: isOwner ? <StadiumIcon size={20} /> : <SearchIcon size={20} />,
      end: true,
    },
    {
      to: "/dashboard/reservations",
      label: isOwner ? "Reservations" : "My Reservations",
      icon: <TicketIcon size={20} />,
    },
    {
      to: "/dashboard/messages",
      label: "Messages",
      icon: <MessageIcon size={20} />,
    },
  ];

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="dash">
      <aside className={`dash-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="dash-brand">
          <span className="dash-brand-mark">
            <StadiumIcon size={22} />
          </span>
          <span className="dash-brand-name">StadiumHub</span>
          <button
            className="dash-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <XIcon size={22} />
          </button>
        </div>

        <nav className="dash-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `dash-nav-link ${isActive ? "is-active" : ""}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="dash-user">
          <div className="dash-user-info">
            <span className="dash-avatar" aria-hidden="true">
              {user?.username?.charAt(0).toUpperCase() ?? "?"}
            </span>
            <div className="dash-user-text">
              <span className="dash-user-name">{user?.username}</span>
              <span className="dash-user-role">{user?.role}</span>
            </div>
          </div>
          <button className="dash-logout" onClick={handleLogout}>
            <LogOutIcon size={18} />
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="dash-scrim" onClick={() => setMobileOpen(false)} />
      )}

      <div className="dash-main">
        <header className="dash-topbar">
          <button
            className="dash-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon size={24} />
          </button>
          <span className="dash-topbar-brand">StadiumHub</span>
        </header>
        <main className={`dash-content ${isMessages ? "is-flush" : ""}`}>
          <Outlet />
        </main>
        {!isMessages && <Footer bg="var(--color-bg)" variant="light" />}
      </div>
    </div>
  );
}

export default DashboardLayout;
