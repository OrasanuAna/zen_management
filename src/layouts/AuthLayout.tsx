import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="zs-auth-layout">
      <div className="zs-auth-layout__panel">
        <div className="zs-auth-layout__brand">
          <span className="zs-auth-layout__logo" aria-hidden>
            <img
              src="/favicon.png"
              alt="Zensushi Logo"
              width="40"
              height="40"
            />
          </span>
          <div>
            <p className="zs-auth-layout__name">Zen Sushi Manager</p>
            <p className="zs-auth-layout__tagline">
              Panou operațional pentru manageri
            </p>
          </div>
        </div>
        <Outlet />
      </div>
      <aside className="zs-auth-layout__aside" aria-hidden>
        <div className="zs-auth-layout__pattern" />
      </aside>
    </div>
  );
}
