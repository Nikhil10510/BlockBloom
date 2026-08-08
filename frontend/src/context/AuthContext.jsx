import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useSignMessage, useChainId } from 'wagmi';
import { SiweMessage } from 'siwe';

const AuthContext = createContext();

import { API_BASE } from '../utils/apiConfig';

export function AuthProvider({ children }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (e) {
      console.error(e);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (chainId) => {
    if (!address) return;
    try {
      const nonceRes = await fetch(`${API_BASE}/auth/nonce`);
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to BlockBloom DAO.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });

      const preparedMessage = message.prepareMessage();
      const signature = await signMessageAsync({ message: preparedMessage });

      const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: preparedMessage, signature })
      });
      
      const data = await verifyRes.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data.user);
      }
    } catch (e) {
      console.error('Login failed', e);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  // Automatically prompt login if wallet connects but no token, or if address changed in MetaMask
  useEffect(() => {
    if (isConnected && address) {
      if (user && user.address && user.address.toLowerCase() !== address.toLowerCase()) {
        // Address changed in MetaMask — logout old session token
        logout();
      } else if (!token && !loading && chainId) {
        login(chainId);
      }
    } else if (!isConnected && token) {
      logout();
    }
  }, [isConnected, address, token, user, loading, chainId]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
