import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import ChatBubble from './ChatBubble';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();

  // Protect the inner dashboard routes
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        <main className="scroll-area">
          <Outlet />
        </main>
      </div>
      <ChatBubble />
    </div>
  );
}
