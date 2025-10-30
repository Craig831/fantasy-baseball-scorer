import React from 'react';
import { Player } from '../../types/player';
import './PlayerCard.css';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick }) => {
  return (
    <div className="player-card" onClick={onClick}>
      <div className="player-header">
        <div className="player-name-section">
          <h4>{player.name}</h4>
          <span className="jersey-number">#{player.jerseyNumber || '--'}</span>
        </div>
        <span className={`status-badge status-${player.status}`}>
          {player.status}
        </span>
      </div>

      <div className="player-info">
        <div className="info-row">
          <span className="label">Team:</span>
          <span className="value">{player.team}</span>
        </div>
        <div className="info-row">
          <span className="label">Position:</span>
          <span className="value">{player.position}</span>
        </div>
        <div className="info-row">
          <span className="label">Season:</span>
          <span className="value">{player.season}</span>
        </div>
      </div>

      <div className="player-footer">
        <span className="updated-time">
          Updated: {new Date(player.lastUpdated).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default PlayerCard;
