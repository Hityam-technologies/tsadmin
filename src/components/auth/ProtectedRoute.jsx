import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SessionGate } from './SessionGate';

export function ProtectedRoute({ children }) {
  const { currentUser, isRestoring } = useAuth();
  const location = useLocation();

  // Wait for the saved session before choosing login or the requested page.
  if (isRestoring) return <SessionGate />;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

