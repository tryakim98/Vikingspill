import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import RoleSelect from './pages/RoleSelect';
import TeacherPanel from './pages/TeacherPanel';
import StudentGame from './pages/StudentGame';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/teacher" element={<TeacherPanel />} />
        <Route path="/student" element={<StudentGame />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
