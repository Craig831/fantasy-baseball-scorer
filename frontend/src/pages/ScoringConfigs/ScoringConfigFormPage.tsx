import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

interface StatEntry {
  name: string;
  points: number;
}

const ScoringConfigFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [battingStats, setBattingStats] = useState<StatEntry[]>([
    { name: 'hits', points: 1 },
    { name: 'doubles', points: 2 },
    { name: 'triples', points: 3 },
    { name: 'homeRuns', points: 4 },
    { name: 'rbis', points: 1 },
    { name: 'runs', points: 1 },
    { name: 'stolenBases', points: 2 },
  ]);
  const [pitchingStats, setPitchingStats] = useState<StatEntry[]>([
    { name: 'wins', points: 5 },
    { name: 'saves', points: 5 },
    { name: 'strikeouts', points: 1 },
    { name: 'inningsPitched', points: 3 },
    { name: 'earnedRuns', points: -2 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      fetchConfig(id);
    }
  }, [id, isEditMode]);

  const fetchConfig = async (configId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/scoring-configs/${configId}`);
      const config = response.data.data;

      setName(config.name);
      setIsActive(config.isActive);

      // Convert categories object to array format
      const battingEntries = Object.entries(config.categories.batting).map(([name, points]) => ({
        name,
        points: points as number,
      }));
      const pitchingEntries = Object.entries(config.categories.pitching).map(([name, points]) => ({
        name,
        points: points as number,
      }));

      setBattingStats(battingEntries);
      setPitchingStats(pitchingEntries);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load configuration');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Configuration name is required');
      return;
    }

    // Convert arrays to objects
    const categories = {
      batting: Object.fromEntries(
        battingStats.filter(s => s.name.trim()).map(s => [s.name, s.points])
      ),
      pitching: Object.fromEntries(
        pitchingStats.filter(s => s.name.trim()).map(s => [s.name, s.points])
      ),
    };

    try {
      setLoading(true);
      if (isEditMode && id) {
        await api.patch(`/scoring-configs/${id}`, { name, categories });
      } else {
        await api.post('/scoring-configs', { name, categories, isActive });
      }
      navigate('/scoring-configs');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save configuration');
      setLoading(false);
    }
  };

  const addBattingStat = () => {
    setBattingStats([...battingStats, { name: '', points: 0 }]);
  };

  const removeBattingStat = (index: number) => {
    setBattingStats(battingStats.filter((_, i) => i !== index));
  };

  const updateBattingStat = (index: number, field: 'name' | 'points', value: string | number) => {
    const newStats = [...battingStats];
    newStats[index] = {
      ...newStats[index],
      [field]: value,
    };
    setBattingStats(newStats);
  };

  const addPitchingStat = () => {
    setPitchingStats([...pitchingStats, { name: '', points: 0 }]);
  };

  const removePitchingStat = (index: number) => {
    setPitchingStats(pitchingStats.filter((_, i) => i !== index));
  };

  const updatePitchingStat = (index: number, field: 'name' | 'points', value: string | number) => {
    const newStats = [...pitchingStats];
    newStats[index] = {
      ...newStats[index],
      [field]: value,
    };
    setPitchingStats(newStats);
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Fantasy Baseball Scorer</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/scoring-configs')}
                className="text-gray-700 hover:text-gray-900"
              >
                Back to Configurations
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditMode ? 'Edit' : 'Create'} Scoring Configuration
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Configuration Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., My League 2025"
                required
              />
            </div>

            {!isEditMode && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Set as active configuration
                </label>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Batting Stats</h3>
              <button
                type="button"
                onClick={addBattingStat}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-200"
              >
                Add Stat
              </button>
            </div>

            <div className="space-y-2">
              {battingStats.map((stat, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={stat.name}
                    onChange={(e) => updateBattingStat(index, 'name', e.target.value)}
                    placeholder="Stat name (e.g., hits)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={stat.points}
                    onChange={(e) => updateBattingStat(index, 'points', parseFloat(e.target.value))}
                    placeholder="Points"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeBattingStat(index)}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Pitching Stats</h3>
              <button
                type="button"
                onClick={addPitchingStat}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-200"
              >
                Add Stat
              </button>
            </div>

            <div className="space-y-2">
              {pitchingStats.map((stat, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={stat.name}
                    onChange={(e) => updatePitchingStat(index, 'name', e.target.value)}
                    placeholder="Stat name (e.g., strikeouts)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={stat.points}
                    onChange={(e) => updatePitchingStat(index, 'points', parseFloat(e.target.value))}
                    placeholder="Points"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => removePitchingStat(index)}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/scoring-configs')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Configuration' : 'Create Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScoringConfigFormPage;
