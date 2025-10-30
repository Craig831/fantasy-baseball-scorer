import React, { useEffect, useState } from 'react';
import { PlayerSearchFilters } from '../../types/player';
import './FilterPanel.css';

interface FilterPanelProps {
  filters: PlayerSearchFilters;
  onFilterChange: (filters: PlayerSearchFilters) => void;
  teams: string[];
  positions: string[];
  onLoadTeams: () => void;
  onLoadPositions: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  teams,
  positions,
  onLoadTeams,
  onLoadPositions,
}) => {
  const [localFilters, setLocalFilters] = useState<PlayerSearchFilters>(filters);

  useEffect(() => {
    onLoadTeams();
    onLoadPositions();
  }, [onLoadTeams, onLoadPositions]);

  const handlePositionChange = (position: string) => {
    const currentPositions = localFilters.position || [];
    const newPositions = currentPositions.includes(position)
      ? currentPositions.filter((p) => p !== position)
      : [...currentPositions, position];

    setLocalFilters({ ...localFilters, position: newPositions });
  };

  const handleTeamChange = (team: string) => {
    const currentTeams = localFilters.team || [];
    const newTeams = currentTeams.includes(team)
      ? currentTeams.filter((t) => t !== team)
      : [...currentTeams, team];

    setLocalFilters({ ...localFilters, team: newTeams });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const cleared: PlayerSearchFilters = {
      position: [],
      team: [],
      status: undefined,
      season: new Date().getFullYear(),
    };
    setLocalFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <div className="filter-panel">
      <h3>Filter Players</h3>

      <div className="filter-section">
        <label>Position</label>
        <div className="checkbox-group">
          {positions.map((pos) => (
            <label key={pos} className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.position?.includes(pos) || false}
                onChange={() => handlePositionChange(pos)}
              />
              {pos}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label>Team</label>
        <div className="checkbox-group scrollable">
          {teams.map((team) => (
            <label key={team} className="checkbox-label">
              <input
                type="checkbox"
                checked={localFilters.team?.includes(team) || false}
                onChange={() => handleTeamChange(team)}
              />
              {team}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label htmlFor="season">Season</label>
        <input
          id="season"
          type="number"
          value={localFilters.season || new Date().getFullYear()}
          onChange={(e) =>
            setLocalFilters({ ...localFilters, season: parseInt(e.target.value, 10) })
          }
          min="2000"
          max={new Date().getFullYear() + 1}
        />
      </div>

      <div className="filter-section">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={localFilters.status || 'active'}
          onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="injured">Injured</option>
        </select>
      </div>

      <div className="filter-actions">
        <button onClick={handleApplyFilters} className="btn-primary">
          Apply Filters
        </button>
        <button onClick={handleClearFilters} className="btn-secondary">
          Clear All
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
