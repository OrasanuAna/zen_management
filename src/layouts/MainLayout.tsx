import clsx from "clsx";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { paths } from "@/app/router/paths";
import { useAuth } from "@/app/providers/AuthProvider";
import { accountNavItems, mainNavItems } from "@/shared/constants/navigation";
import { NavIcon } from "@/shared/components/layout/NavIcon";
import { Button } from "@/shared/components/ui/Button";

export function MainLayout() {
  const { profile, signOutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={clsx("zs-shell", menuOpen && "zs-shell--nav-open")}>
      <div
        className="zs-shell__scrim"
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      />
      <aside className="zs-sidebar" aria-label="Navigare principală">
        <div className="zs-sidebar__brand">
          <span className="zs-sidebar__mark" aria-hidden>
            <img
              src="/favicon.png"
              alt="Zensushi Logo"
              width="40"
              height="40"
            />
          </span>
          <div>
            <p className="zs-sidebar__title">Zen Sushi</p>
            <p className="zs-sidebar__subtitle">Manager</p>
          </div>
        </div>
        <nav className="zs-sidebar__nav">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === paths.dashboard}
              className={({ isActive }) =>
                clsx("zs-navlink", isActive && "zs-navlink--active")
              }
              onClick={closeMenu}
            >
              <span className="zs-navlink__icon">
                <NavIcon name={item.icon} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="zs-sidebar__section">
          <p className="zs-sidebar__section-label">Cont</p>
          <nav className="zs-sidebar__nav">
            {accountNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx("zs-navlink", isActive && "zs-navlink--active")
                }
                onClick={closeMenu}
              >
                <span className="zs-navlink__icon">
                  <NavIcon name={item.icon} />
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <div className="zs-main">
        <header className="zs-topbar">
          <button
            type="button"
            className="zs-icon-button zs-topbar__menu"
            aria-label="Deschide meniul"
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden>☰</span>
          </button>
          <div className="zs-topbar__spacer" />
          <div className="zs-topbar__user">
            <span className="zs-topbar__name">
              {profile?.displayName ?? "Manager"}
            </span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void signOutUser()}
            >
              Deconectare
            </Button>
          </div>
        </header>
        <main className="zs-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
