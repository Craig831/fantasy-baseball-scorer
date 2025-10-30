import React, { useState, useCallback, useEffect } from 'react';
import FilterPanel from '../components/player-research/FilterPanel';
import PlayerList from '../components/player-research/PlayerList';
import { Player, PlayerSearchFilters } from '../types/player';
import { searchPlayers, getTeams, getPositions } from '../services/api';
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
  const [filters, setFilters] = useState<PlayerSearchFilters>({
    position: [],
    team: [],
    status: 'active',
    season: new Date().getFullYear(),
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Load filter options
  const loadTeams = useCallback(async () => {
    try {
      const teamList = await getTeams();
      setTeams(teamList);
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  }, []);

  const loadPositions = useCallback(async () => {
    try {
      const positionList = await getPositions();
      setPositions(positionList);
    } catch (err) {
      console.error('Failed to load positions:', err);
    }
  }, []);

  // Search players
  const performSearch = useCallback(async (searchFilters: PlayerSearchFilters, page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchPlayers(searchFilters, page);
      setPlayers(response.players);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message || 'Failed to load players. Please try again.');
      setPlayers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial search on mount
  useEffect(() => {
    performSearch(filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle filter changes
  const handleFilterChange = (newFilters: PlayerSearchFilters) => {
    setFilters(newFilters);
    performSearch(newFilters, 1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    performSearch(filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle player click
  const handlePlayerClick = (player: Player) => {
    // TODO: Phase 4 - Open player details modal or navigate to player page
    console.log('Player clicked:', player);
  };

  return (
    <div className="player-research-page">
      <div className="page-header">
        <h1>Player Research</h1>
        <p className="page-description">
          Search and filter baseball players to analyze performance and build your lineup.
        </p>
      </div>

      <div className="page-content">
        <aside className="filters-sidebar">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            teams={teams}
            positions={positions}
            onLoadTeams={loadTeams}
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
          />
        </main>
      </div>
    </div>
  );
};

export default PlayerResearch;
