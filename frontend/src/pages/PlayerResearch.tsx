import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterPanel from '../components/player-research/FilterPanel';
import PlayerList from '../components/player-research/PlayerList';
import ScoringConfigSelector from '../components/player-research/ScoringConfigSelector';
import ScoreBreakdownModal from '../components/player-research/ScoreBreakdownModal';
import { Player, PlayerSearchFilters, ScoreBreakdown } from '../types/player';
import { searchPlayers, getPositions, getPlayerScoreBreakdown } from '../services/api';
import './PlayerResearch.css';

interface SearchResponse {
  players: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const PlayerResearch: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PlayerSearchFilters>({
    position: [],
    league: 'both',
    statisticType: 'hitting',
    status: 'active',
    season: new Date().getFullYear(),
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positions, setPositions] = useState<string[]>([]);
  const [scoringConfigId, setScoringConfigId] = useState<string | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load filter options
  const loadPositions = useCallback(async () => {
    try {
      const positionList = await getPositions();
      setPositions(positionList);
    } catch (err) {
      console.error('Failed to load positions:', err);
    }
  }, []);

  // Search players
  const performSearch = useCallback(async (
    searchFilters: PlayerSearchFilters,
    page: number = 1,
    configId: string | null = null,
    sort?: string,
    order?: 'asc' | 'desc'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchPlayers(searchFilters, page, 50, configId, sort, order);
      setPlayers(response.players);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load players. Please try again.');
      setPlayers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load data on mount
  useEffect(() => {
    performSearch(filters, 1, scoringConfigId, sortBy, sortOrder);
    loadPositions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle scoring config change
  const handleConfigChange = (configId: string | null) => {
    setScoringConfigId(configId);
    performSearch(filters, 1, configId, sortBy, sortOrder);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: PlayerSearchFilters) => {
    setFilters(newFilters);
    performSearch(newFilters, 1, scoringConfigId, sortBy, sortOrder);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    performSearch(filters, page, scoringConfigId, sortBy, sortOrder);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sort change
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(direction);
    performSearch(filters, 1, scoringConfigId, field, direction);
  };

  // Handle player click
  const handlePlayerClick = (player: Player) => {
    // Future: Open player details modal or navigate to player page
    console.log('Player clicked:', player);
  };

  // Handle score click to show breakdown
  const handleScoreClick = async (player: Player) => {
    if (!scoringConfigId) return;

    try {
      const breakdown = await getPlayerScoreBreakdown(player.id, scoringConfigId);
      setScoreBreakdown(breakdown);
      setSelectedPlayer(player);
    } catch (err) {
      console.error('Failed to load score breakdown:', err);
    }
  };

  // Close score breakdown modal
  const closeScoreBreakdown = () => {
    setScoreBreakdown(null);
    setSelectedPlayer(null);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Fantasy Baseball Scorer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-700 hover:text-gray-900"
              >
                Home
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="player-research-page">
      <div className="page-header">
        <h1>Player Research</h1>
        <p className="page-description">
          Search and filter baseball players to analyze performance and build your lineup.
        </p>
      </div>

      <ScoringConfigSelector
        selectedConfigId={scoringConfigId}
        onConfigChange={handleConfigChange}
      />

      {!scoringConfigId && (
        <div className="no-config-message">
          Select a scoring configuration above to see player scores
        </div>
      )}

      <div className="page-content">
        <aside className="filters-sidebar">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            positions={positions}
            onLoadPositions={loadPositions}
          />
        </aside>

        <main className="players-main">
          <PlayerList
            players={players}
            loading={loading}
            error={error}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPlayerClick={handlePlayerClick}
            onScoreClick={handleScoreClick}
            onSortChange={handleSortChange}
            statisticType={filters.statisticType || 'hitting'}
          />
        </main>
      </div>

      {scoreBreakdown && selectedPlayer && (
        <ScoreBreakdownModal
          breakdown={scoreBreakdown}
          playerName={selectedPlayer.name}
          onClose={closeScoreBreakdown}
        />
      )}
      </div>
    </div>
  );
};

export default PlayerResearch;
