import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function Shell() {
  return (
    <>
      <nav className="topnav">
        <span className="nav-brand">◧ figma-to-react</span>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Convert
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Projects
        </NavLink>
      </nav>
      <Outlet />
    </>
  );
}
