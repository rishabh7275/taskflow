import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks";
import { useTaskStore } from "../store";
import PageSkeleton from "./PageSkeleton";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const isDataLoaded = useTaskStore((s) => s.isDataLoaded);
  const location = useLocation();

  if (loading || (user && !isDataLoaded)) {
    return <PageSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
