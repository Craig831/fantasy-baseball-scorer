import React, { useState } from 'react';
import { Player } from '../../types/player';
import PlayerCard from './PlayerCard';
import './PlayerList.css';

interface PlayerListProps {
  players: Player[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
  onPageChange: (page: number) => void;
  onPlayerClick?: (player: Player) => void;
  onScoreClick?: (player: Player) => void;
  statisticType: 'hitting' | 'pitching';
}

type SortField = 'name' | 'team' | 'position' | 'score';
type SortDirection = 'asc' | 'desc';

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  loading,
  error,
  pagination,
  onPageChange,
  onPlayerClick,
  onScoreClick,
  statisticType,
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortField) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'team':
        aValue = a.team?.name || '';
        bValue = b.team?.name || '';
        break;
      case 'position':
        aValue = a.position;
        bValue = b.position;
        break;
      case 'score':
        aValue = a.score || 0;
        bValue = b.score || 0;
        break;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
  });

  if (loading) {
    return (
      <div className="player-list-loading">
        <div className="spinner"></div>
        <p>Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-list-error">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="player-list-empty">
        <p>No players found matching your criteria.</p>
        <p className="hint">Try adjusting your filters.</p>
      </div>
    );
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="player-list-container">
      <div className="player-list-header">
        <h3>Players ({statisticType === 'hitting' ? 'Hitting' : 'Pitching'} Stats)</h3>
        {pagination && (
          <span className="result-count">
            Showing {players.length} of {pagination.total} players
          </span>
        )}
      </div>

      <div className="player-table-wrapper">
        <table className="player-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('team')} className="sortable">
                Team {getSortIcon('team')}
              </th>
              <th onClick={() => handleSort('position')} className="sortable">
                Position {getSortIcon('position')}
              </th>
              <th>Status</th>
              <th>Season</th>
              <th onClick={() => handleSort('score')} className="sortable">
                Score {getSortIcon('score')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onClick={() => onPlayerClick?.(player)}
                onScoreClick={() => onScoreClick?.(player)}
                statisticType={statisticType}
              />
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>

          <div className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </div>

          <button
            className="pagination-btn"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasMore}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
