import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  registerWithFirebase,
  loginWithFirebase,
  loginWithGoogle,
  logoutFromFirebase,
  resetFirebasePassword,
  resendFirebaseVerification,
  onFirebaseAuthStateChanged,
  isFirebaseConfigured
} from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Restore stored session immediately for fast first render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    // Attach Firebase Auth state listener if configured
    if (isFirebaseConfigured) {
      const unsubscribe = onFirebaseAuthStateChanged((authResult) => {
        if (authResult) {
          const { user: fbUserData, token: fbToken } = authResult;
          setUser(fbUserData);
          setToken(fbToken);
          localStorage.setItem('user', JSON.stringify(fbUserData));
          localStorage.setItem('token', fbToken);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      if (isFirebaseConfigured) {
        await logoutFromFirebase();
      }
    } catch (err) {
      console.warn('Firebase logout warning:', err);
    }
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Firebase Auth Actions
  const firebaseRegister = async (payload) => {
    const res = await registerWithFirebase(payload);
    login(res.user, res.token);
    return res;
  };

  const firebaseLogin = async (email, password) => {
    const res = await loginWithFirebase(email, password);
    login(res.user, res.token);
    return res;
  };

  const firebaseGoogleLogin = async (role = 'LOST_USER') => {
    const res = await loginWithGoogle(role);
    login(res.user, res.token);
    return res;
  };

  const firebaseResetPassword = async (email) => {
    return await resetFirebasePassword(email);
  };

  const firebaseResendVerification = async () => {
    return await resendFirebaseVerification();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isFirebaseConfigured,
        firebaseRegister,
        firebaseLogin,
        firebaseGoogleLogin,
        firebaseResetPassword,
        firebaseResendVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
