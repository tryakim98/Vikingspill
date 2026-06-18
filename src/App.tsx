import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from 'react-error-boundary';
import './App.css';

// Pages
import StartScreen from './pages/StartScreen';
import TeacherPanel from './pages/TeacherPanel';
import StudentGame from './pages/StudentGame';
import ForLarere from './pages/ForLarere';
import ErrorFallback from './components/common/ErrorFallback';

function App() {
  return (
    // reducedMotion="user" respekterer prefers-reduced-motion (§13 tilgjengelighet).
    <MotionConfig reducedMotion="user">
      {/* Fanger uventede feil i hele appen og viser en viking-tema feilskjerm (§13). */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Router>
          <Routes>
            <Route path="/" element={<StartScreen />} />
            <Route path="/teacher" element={<TeacherPanel />} />
            <Route path="/student" element={<StudentGame />} />
            <Route path="/for-larere" element={<ForLarere />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </MotionConfig>
  );
}

export default App;
