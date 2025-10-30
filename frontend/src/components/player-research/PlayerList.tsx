import React from 'react';
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
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  loading,
  error,
  pagination,
  onPageChange,
  onPlayerClick,
}) => {
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

  return (
    <div className="player-list-container">
      <div className="player-list-header">
        <h3>Players</h3>
        {pagination && (
          <span className="result-count">
            Showing {players.length} of {pagination.total} players
          </span>
        )}
      </div>

      <div className="player-grid">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={() => onPlayerClick?.(player)}
          />
        ))}
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
