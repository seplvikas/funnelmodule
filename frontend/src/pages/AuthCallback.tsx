import React, { useEffect } from 'react';
import { useMsal } from '@microsoft/msal-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export function AuthCallback() {
  const { instance, accounts } = useMsal();
  const { login, setIsLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);

    async function handleCallback() {
      try {
        if (accounts.length === 0) {
          navigate('/login');
          return;
        }

        const account = accounts[0];
        const response = await instance.acquireTokenSilent({
          scopes: ['user.read'],
          account,
        });

        // Send token to backend for validation and JWT generation
        const result = await authApi.azureCallback({
          id_token: response.idToken,
          email: account.username,
          name: account.name,
          oid: account.localAccountId,
        });

        login(result.data.user, result.data.token);
        navigate('/dashboard');
      } catch (error) {
        console.error('Authentication failed:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    }

    handleCallback();
  }, [instance, accounts, login, navigate, setIsLoading]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        <p className="text-white mt-4">Authenticating...</p>
      </div>
    </div>
  );
}
