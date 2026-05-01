/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { auth, loginAnonymously } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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

import { Toaster } from "react-hot-toast";

export default function App() {
  useEffect(() => {
    let isSigningIn = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If no user and we're not currently in the middle of a sign-in process,
      // and we are NOT on the login page (to avoid conflicting with manual sign-in),
      // try to sign in anonymously.
      const isLoginPage = window.location.pathname.includes('/login');

      if (!user && !isSigningIn && !isLoginPage) {
        try {
          isSigningIn = true;
          await loginAnonymously();
        } catch (err) {
          console.error("Global anonymous login failed", err);
        } finally {
          isSigningIn = false;
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
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
