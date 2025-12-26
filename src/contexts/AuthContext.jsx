import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(sessionStorage.getItem('authToken'));

  const login = (userData, authToken) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('authToken', authToken);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};