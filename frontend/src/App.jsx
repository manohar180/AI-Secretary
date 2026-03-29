import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workflows from './pages/Workflows';
import Settings from './pages/Settings';
import Integrations from './pages/Integrations';
import IntakeForm from './pages/IntakeForm';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/intake" element={<IntakeForm />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="workflows" element={<Workflows />} />
            <Route path="settings" element={<Settings />} />
            <Route path="configuration" element={<Integrations />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
