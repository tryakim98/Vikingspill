import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { MotionConfig } from "motion/react";
import { ErrorBoundary } from "react-error-boundary";
import "./App.css";

// Pages
import StartScreen from "./pages/StartScreen";
const TeacherPanel = lazy(() => import("./pages/TeacherPanel"));
const StudentGame = lazy(() => import("./pages/StudentGame"));
const ForLarere = lazy(() => import("./pages/ForLarere"));
import ErrorFallback from "./components/common/ErrorFallback";

function App() {
  return (
    // reducedMotion="user" respekterer prefers-reduced-motion (§13 tilgjengelighet).
    <MotionConfig reducedMotion="user">
      {/* Fanger uventede feil i hele appen og viser en viking-tema feilskjerm (§13). */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Router>
          <Suspense
            fallback={
              <main
                className="viking-screen p-12 text-viking-paper"
                role="status"
              >
                Henter skipsloggen …
              </main>
            }
          >
            <Routes>
              <Route path="/" element={<StartScreen />} />
              <Route path="/teacher" element={<TeacherPanel />} />
              <Route path="/student" element={<StudentGame />} />
              <Route path="/for-larere" element={<ForLarere />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
    </MotionConfig>
  );
}

export default App;
