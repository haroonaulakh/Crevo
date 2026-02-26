import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import WithdrawnStudents from './pages/WithdrawnStudents';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/withdrawn" element={<WithdrawnStudents />} />
    </Routes>
  )
}

export default App
