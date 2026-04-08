import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import RegisterView from './views/RegisterView';
import DashboardView from './views/DashboardView';
import LoginView from './views/LoginView';
import WhiteboardEditorView from './views/WhiteboardEditorView';

export default function App() {
  const [session, setSession] = useState(localStorage.getItem('userId'));

  const handleAuthChange = (id) => {
    setSession(id);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <LoginView onAuthSuccess={handleAuthChange} />} />
        <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <RegisterView onAuthSuccess={handleAuthChange} />} />
        <Route path="/whiteboard/:id" element={<WhiteboardEditorView />} />

        <Route
          path="/dashboard"
          element={session ? <DashboardView /> : <Navigate to="/login" />}
        />

        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}