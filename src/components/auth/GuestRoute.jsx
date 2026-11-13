import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SessionGate } from './SessionGate';

/**
 * The login screen is only for people who are signed out.
 * A saved session goes straight to the page they asked for, or the dashboard.
 */
export function GuestRoute({ children }) {
  const { currentUser, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) return <SessionGate />;
  if (currentUser) {
    const from = location.state?.from;
    const target = from?.pathname && from.pathname !== '/login' ? from : '/';
    return <Navigate to={target} replace />;
  }
  return children;
}
