import React, { useEffect } from 'react';
import { useJourneyStore } from './stores/useJourneyStore';
import { useProfileStore } from './stores/useProfileStore';
import { useAgentStream } from './hooks/useAgentStream';
import { api } from './api/client';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './features/landing/LandingPage';
import { JourneyWorkspace } from './features/journey/JourneyWorkspace';
import { DocumentsHub } from './features/documents/DocumentsHub';
import { VideoStudio } from './features/video/VideoStudio';
import { ReviewClarifications } from './features/review/ReviewClarifications';
import { QualificationView } from './features/qualification/QualificationView';
import { CvStudio } from './features/cv/CvStudio';
import { ConsultantDashboard } from './features/consultant/ConsultantDashboard';
import { HealthPage } from './features/health/HealthPage';
import { DemoToolbar } from './components/demo/DemoToolbar';

export function App() {
  const { stage, conversationId, token, setStage } = useJourneyStore();
  const { setFullProfile } = useProfileStore();

  // Connect SSE real-time agent stream whenever conversationId is set
  useAgentStream(conversationId);

  // Initial session recovery
  useEffect(() => {
    if (token) {
      api.profile
        .get()
        .then((prof) => {
          setFullProfile(prof);
          if (stage === 'LANDING') {
            setStage('WORKSPACE');
          }
        })
        .catch(() => {
          // Token invalid or reset
        });
    }
  }, [token]);

  // Check for direct /health URL
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/health' || window.location.search.includes('view=health'))) {
      setStage('HEALTH');
    }
  }, [setStage]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {stage !== 'LANDING' && <Navbar />}

      <main className="flex-1 min-h-0">
        {stage === 'LANDING' && <LandingPage />}
        {stage === 'WORKSPACE' && <JourneyWorkspace />}
        {stage === 'DOCUMENTS' && <DocumentsHub />}
        {stage === 'VIDEO' && <VideoStudio />}
        {stage === 'REVIEW' && <ReviewClarifications />}
        {stage === 'QUALIFICATION' && <QualificationView />}
        {stage === 'CV_STUDIO' && <CvStudio />}
        {stage === 'CONSULTANT_DASHBOARD' && <ConsultantDashboard />}
        {stage === 'HEALTH' && <HealthPage />}
      </main>

      {/* Floating Demo Persona & Reset Toolbar */}
      <DemoToolbar />
    </div>
  );
}

export default App;
