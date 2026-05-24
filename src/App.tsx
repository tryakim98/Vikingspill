import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import './App.css';

// Pages
import RoleSelect from './pages/RoleSelect';
import TeacherPanel from './pages/TeacherPanel';
import StudentGame from './pages/StudentGame';

function App() {
  return (
    // reducedMotion="user" respekterer prefers-reduced-motion (§13 tilgjengelighet).
    <MotionConfig reducedMotion="user">
      <Router>
        <Routes>
          <Route path="/" element={<RoleSelect />} />
          <Route path="/teacher" element={<TeacherPanel />} />
          <Route path="/student" element={<StudentGame />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </MotionConfig>
  );
}

export default App;
