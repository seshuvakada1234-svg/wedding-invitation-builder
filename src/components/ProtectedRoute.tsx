// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: Props) {
  const { user, role, loading } = useAuth();

  // Show spinner while Firebase restores session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-bg">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="w-16 h-16 border-2 border-editorial-accent/20 rounded-full" />
             <div className="absolute top-0 left-0 w-16 h-16 border-2 border-editorial-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-editorial-muted font-serif italic text-lg animate-pulse">Entering your cinematic story...</p>
        </div>
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin → go to dashboard
  if (requireAdmin && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}