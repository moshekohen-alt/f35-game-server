import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { AppProvider, useApp } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import SelectProfile from './pages/SelectProfile';
import Home from './pages/Home';
import Timeline from './pages/Timeline';
import LogisticsRoad from './pages/LogisticsRoad';
import Tasks from './pages/Tasks';
import Budget from './pages/Budget';
import SectionHome from './pages/SectionHome';
import DestinationDetail from './pages/DestinationDetail';
import DayPlan from './pages/DayPlan';
import Surveys from './pages/Surveys';
import PackingList from './pages/PackingList';
import Broadway from './pages/Broadway';
import Gallery from './pages/Gallery';

import ImageManager from './pages/ImageManager';
import More from './pages/More';
import GalleryAll from './pages/GalleryAll';
import ScreenshotReview from './pages/ScreenshotReview';
import Arcade from './pages/Arcade';
import ActivityGalleryPage from './pages/ActivityGalleryPage';
import WarmNarration from './pages/WarmNarration';

function ProfileGuard({ children }) {
  const { selectedFamily } = useApp();
  if (!selectedFamily) return <Navigate to="/select-profile" replace />;
  return children;
}

// Controls where the app opens:
//  - Cold start (app was fully closed): sessionStorage is empty → clear the
//    saved profile and go to user selection.
//  - Warm reload / returning within the same session: jump to the home page,
//    so a user always lands on home rather than a deep page they left open.
function SessionBoot() {
  const { resetProfile } = useApp();
  const navigate = useNavigate();
  useEffect(() => {
    let coldStart = false;
    try {
      coldStart = !sessionStorage.getItem('trip_session_live');
      sessionStorage.setItem('trip_session_live', '1');
    } catch { /* sessionStorage blocked → treat as warm */ }
    if (coldStart) {
      resetProfile();
      navigate('/select-profile', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
    // run once, on the first mount of each page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <AppProvider>
      <SessionBoot />
      <Routes>
        <Route path="/select-profile" element={<SelectProfile />} />
        <Route element={<ProfileGuard><AppLayout /></ProfileGuard>}>
          <Route path="/" element={<Home />} />
          <Route path="/section/:sectionId" element={<SectionHome />} />
          <Route path="/destination/:destinationId" element={<DestinationDetail />} />
          <Route path="/destination/:destinationId/day/:date" element={<DayPlan />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/logistics" element={<LogisticsRoad />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/packing" element={<PackingList />} />
          <Route path="/broadway" element={<Broadway />} />
          <Route path="/gallery/:destinationId" element={<Gallery />} />

          <Route path="/images" element={<ImageManager />} />
          <Route path="/more" element={<More />} />
          <Route path="/gallery-all" element={<GalleryAll />} />
          <Route path="/screenshot-review" element={<ScreenshotReview />} />

        </Route>
        <Route path="/arcade" element={<Arcade />} />
        <Route path="/activity-gallery" element={<ActivityGalleryPage />} />
        <Route path="/warm-narration" element={<WarmNarration />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AppProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;