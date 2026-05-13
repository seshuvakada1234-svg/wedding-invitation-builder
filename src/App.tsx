/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Builder from "./pages/Builder";
import Activate from "./pages/Activate";
import Preview from "./pages/Preview";
import Site from "./pages/Site";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Pricing from "./pages/Pricing";
import TemplatesPage from "./pages/Templates";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="templates" element={<TemplatesPage />} />

            <Route path="dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="builder" element={
              <ProtectedRoute>
                <Builder />
              </ProtectedRoute>
            } />

            <Route path="builder/:templateId" element={
              <ProtectedRoute>
                <Builder />
              </ProtectedRoute>
            } />

            <Route path="builder/edit/:inviteId" element={
              <ProtectedRoute>
                <Builder />
              </ProtectedRoute>
            } />

            <Route path="activate/:slug" element={
              <ProtectedRoute>
                <Activate />
              </ProtectedRoute>
            } />

            <Route path="admin" element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/preview/:templateId" element={<Preview />} />
          <Route path="/story/:id" element={<Site />} />
          <Route path="/invite/:id" element={<Site />} />
          <Route path="/site/:id" element={<Site />} />
          <Route path="/wedding/:id" element={<Site />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}