/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Builder from "./pages/Builder";
import Preview from "./pages/Preview";
import Site from "./pages/Site";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import TemplatesPage from "./pages/Templates";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="templates" element={<TemplatesPage />} />
          
          {/* Protected Routes (Logic inside components) */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="builder" element={<Builder />} />
          <Route path="builder/:templateId" element={<Builder />} />
          <Route path="builder/edit/:inviteId" element={<Builder />} />
          <Route path="preview/:slug" element={<Preview />} />
          <Route path="admin" element={<Admin />} />
        </Route>

        {/* Live Site Routes (No shared layout) */}
        <Route path="/invite/:slug" element={<Site />} />
        <Route path="/site/:slug" element={<Site />} />
        <Route path="/wedding/:slug" element={<Site />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
