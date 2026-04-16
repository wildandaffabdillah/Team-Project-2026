import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

export default function App() {
  const path = window.location.pathname;

  if (path === "/dashboard") {
    return <Dashboard />;
  }

  return <Login />;
}