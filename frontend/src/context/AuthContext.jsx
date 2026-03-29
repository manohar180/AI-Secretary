import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent session
    const storedUser = localStorage.getItem('saas_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (googleToken) => {
    try {
      const decoded = jwtDecode(googleToken);
      
      const response = await fetch('http://localhost:8000/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken })
      });

      if (!response.ok) {
        throw new Error('Backend rejected token.');
      }

      const data = await response.json();
      
      // Merge decoded Google info with Backend Tenant data
      const mockUser = {
        ...data.user,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        token: googleToken
      };
      
      setUser(mockUser);
      localStorage.setItem('saas_user', JSON.stringify(mockUser));
      return { success: true };
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('saas_user');
  };

  if (loading) return <div className="glass-panel">Loading Vault...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
