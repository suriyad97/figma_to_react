import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Shell from "./Shell.jsx";
import App from "./App.jsx";
import Projects from "./pages/Projects.jsx";
import Accuracy from "./pages/Accuracy.jsx";
import Enhance from "./pages/Enhance.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<App />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/accuracy/:slug" element={<Accuracy />} />
        <Route path="/enhance/:slug" element={<Enhance />} />
      </Route>
    </Routes>
  </HashRouter>
);
