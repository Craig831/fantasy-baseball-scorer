import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Fantasy Baseball Scorer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={() => navigate('/account')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Account Settings
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Fantasy Baseball Scorer
              </h2>
              <p className="text-gray-600 mb-6">
                You're successfully logged in! This is the home page of your fantasy baseball application.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  onClick={() => navigate('/scoring-configs')}
                  className="bg-indigo-50 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-indigo-900">Scoring Configs</h3>
                    <p className="mt-2 text-sm text-indigo-700">
                      Create custom scoring configurations for your leagues
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/player-research')}
                  className="bg-green-50 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow text-left"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-green-900">Player Research</h3>
                    <p className="mt-2 text-sm text-green-700">
                      Search and analyze MLB players with your scoring settings
                    </p>
                  </div>
                </button>
                <div className="bg-purple-50 overflow-hidden shadow rounded-lg opacity-50">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-purple-900">Lineups</h3>
                    <p className="mt-2 text-sm text-purple-700">
                      Build and manage your fantasy lineups - up to 25 players (Coming Soon)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
