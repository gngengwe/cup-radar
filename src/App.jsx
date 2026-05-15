import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import HowItWorks from './pages/HowItWorks';
import ErrorBoundary from './components/ErrorBoundary';

// Admin panel is lazy-loaded — it's never on the critical path and adds ~50KB
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

// Redirect old /dashboard/:section URLs to /seattle/:section
function LegacyDashboardRedirect() {
  const { section } = useParams();
  const citylessRoutes = ['today', 'matches', 'groups', 'bracket', 'tickets',
                          'cities', 'news', 'culture', 'watch', 'narrative', 'upsets'];
  if (section === 'seattle')     return <Navigate to="/seattle/hq"      replace />;
  if (section === 'kansascity')  return <Navigate to="/kansascity/hq"   replace />;
  if (citylessRoutes.includes(section))
    return <Navigate to={`/seattle/${section}`} replace />;
  return <Navigate to="/seattle/hq" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Landing — city selection */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/admin" element={
            <Suspense fallback={<div style={{ padding: 40, color: '#7a9085' }}>Loading admin…</div>}>
              <AdminPanel />
            </Suspense>
          } />

          {/* Backward compat first (more specific — must come before /:city/:section) */}
          <Route path="/dashboard" element={<Navigate to="/seattle/hq" replace />} />
          <Route path="/dashboard/:section" element={<LegacyDashboardRedirect />} />

          {/* City redirects (bare /seattle or /kansascity) */}
          <Route path="/seattle" element={<Navigate to="/seattle/hq" replace />} />
          <Route path="/kansascity" element={<Navigate to="/kansascity/hq" replace />} />

          {/* All city dashboards — /:city/:section gives useParams() both values */}
          <Route path="/:city/:section" element={<Dashboard />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
