import React, { useEffect, useState } from 'react';
import { PlayerSearchFilters } from '../../types/player';
import './FilterPanel.css';

interface FilterPanelProps {
  filters: PlayerSearchFilters;
  onFilterChange: (filters: PlayerSearchFilters) => void;
  positions: string[];
  onLoadPositions: () => void;
}

const HITTING_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'LF', 'CF', 'RF', 'DH'];
const PITCHING_POSITIONS = ['P'];

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  positions,
  onLoadPositions,
}) => {
  const [localFilters, setLocalFilters] = useState<PlayerSearchFilters>(filters);
  const [statisticType, setStatisticType] = useState<'hitting' | 'pitching'>('hitting');

  useEffect(() => {
    onLoadPositions();
  }, [onLoadPositions]);

  const handleStatisticTypeChange = (type: 'hitting' | 'pitching') => {
    setStatisticType(type);
    // Clear position filter when switching stat type
    setLocalFilters({ ...localFilters, position: [], statisticType: type });
  };

  const handlePositionChange = (position: string) => {
    const currentPositions = localFilters.position || [];
    const newPositions = currentPositions.includes(position)
      ? currentPositions.filter((p) => p !== position)
      : [...currentPositions, position];

    setLocalFilters({ ...localFilters, position: newPositions });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const cleared: PlayerSearchFilters = {
      position: [],
      league: 'both',
      statisticType: 'hitting',
      status: undefined,
      season: new Date().getFullYear(),
    };
    setLocalFilters(cleared);
    setStatisticType('hitting');
    onFilterChange(cleared);
  };

  // Get positions based on current statistic type
  const availablePositions = statisticType === 'hitting' ? HITTING_POSITIONS : PITCHING_POSITIONS;

  return (
    <div className="filter-panel">
      <h3>Filter Players</h3>

      <div className="filter-section">
        <label>Statistic Type</label>
        <div className="toggle-group">
          <button
            className={`toggle-button ${statisticType === 'hitting' ? 'active' : ''}`}
            onClick={() => handleStatisticTypeChange('hitting')}
          >
            Hitting
          </button>
          <button
            className={`toggle-button ${statisticType === 'pitching' ? 'active' : ''}`}
            onClick={() => handleStatisticTypeChange('pitching')}
          >
            Pitching
          </button>
        </div>
      </div>

      <div className="filter-section">
        <label>Position</label>
        <div className="checkbox-group">
          {availablePositions.map((pos) => (
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
        <label htmlFor="league">League</label>
        <select
          id="league"
          value={localFilters.league || 'both'}
          onChange={(e) => setLocalFilters({ ...localFilters, league: e.target.value as 'both' | 'AL' | 'NL' })}
        >
          <option value="both">Both</option>
          <option value="AL">AL Only</option>
          <option value="NL">NL Only</option>
        </select>
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

      <div className="filter-section">
        <label htmlFor="dateFrom">Stats From Date</label>
        <input
          type="date"
          id="dateFrom"
          value={localFilters.dateFrom || ''}
          onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
        />
      </div>

      <div className="filter-section">
        <label htmlFor="dateTo">Stats To Date</label>
        <input
          type="date"
          id="dateTo"
          value={localFilters.dateTo || ''}
          onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
        />
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
