/**
 * LineupSlot Component
 * Presentational component for a single lineup slot
 * Displays player information and allows slot management
 */

import React from 'react';
import { LineupSlot as LineupSlotType } from '../../services/lineupService';

interface LineupSlotProps {
  slot: LineupSlotType;
  onPlayerSelect?: (slotOrder: number) => void;
  onPlayerRemove?: (slotOrder: number) => void;
  showScore?: boolean;
  isEditable?: boolean;
}

export const LineupSlot: React.FC<LineupSlotProps> = ({
  slot,
  onPlayerSelect,
  onPlayerRemove,
  showScore = false,
  isEditable = false,
}) => {
  const { player, slotOrder, locked } = slot;

  const handleSelect = () => {
    if (isEditable && !locked && onPlayerSelect) {
      onPlayerSelect(slotOrder);
    }
  };

  const handleRemove = () => {
    if (isEditable && !locked && onPlayerRemove) {
      onPlayerRemove(slotOrder);
    }
  };

  // Empty slot
  if (!player) {
    return (
      <div className="lineup-slot lineup-slot--empty">
        <div className="lineup-slot__order">#{slotOrder}</div>
        <div className="lineup-slot__content">
          <div className="lineup-slot__empty-state">
            {isEditable && !locked ? (
              <button
                className="lineup-slot__select-btn"
                onClick={handleSelect}
                aria-label={`Select player for slot ${slotOrder}`}
              >
                + Add Player
              </button>
            ) : (
              <span className="lineup-slot__empty-text">Empty Slot</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filled slot
  return (
    <div className={`lineup-slot ${locked ? 'lineup-slot--locked' : ''}`}>
      <div className="lineup-slot__order">#{slotOrder}</div>
      <div className="lineup-slot__content">
        <div className="lineup-slot__player-info">
          <div className="lineup-slot__player-name">{player.name}</div>
          <div className="lineup-slot__player-details">
            <span className="lineup-slot__position">{player.position}</span>
            {player.team && (
              <>
                <span className="lineup-slot__separator">•</span>
                <span className="lineup-slot__team">{player.team.abbreviation}</span>
              </>
            )}
            {player.jerseyNumber && (
              <>
                <span className="lineup-slot__separator">•</span>
                <span className="lineup-slot__jersey">#{player.jerseyNumber}</span>
              </>
            )}
          </div>
        </div>
        {showScore && (
          <div className="lineup-slot__score">
            <span className="lineup-slot__score-label">Score:</span>
            <span className="lineup-slot__score-value">
              {slot.projectedScore.toFixed(2)}
            </span>
          </div>
        )}
        {isEditable && !locked && (
          <div className="lineup-slot__actions">
            <button
              className="lineup-slot__remove-btn"
              onClick={handleRemove}
              aria-label={`Remove ${player.name} from slot ${slotOrder}`}
            >
              ×
            </button>
          </div>
        )}
        {locked && (
          <div className="lineup-slot__locked-indicator" aria-label="Slot locked">
            🔒
          </div>
        )}
      </div>
    </div>
  );
};
