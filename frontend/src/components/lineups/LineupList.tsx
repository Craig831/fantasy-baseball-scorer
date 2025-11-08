/**
 * LineupList Component
 * Container component for displaying all lineups
 * Uses TanStack Query for data fetching and caching
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLineups, deleteLineup, duplicateLineup } from '../../services/lineupService';
import { useNavigate } from 'react-router-dom';

export const LineupList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch all lineups
  const {
    data: lineups,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lineups'],
    queryFn: getLineups,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLineup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      duplicateLineup(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = async (id: string, originalName: string) => {
    const newName = prompt(`Enter name for duplicated lineup:`, `${originalName} (Copy)`);
    if (newName) {
      duplicateMutation.mutate({ id, name: newName });
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/lineups/${id}/edit`);
  };

  const handleView = (id: string) => {
    navigate(`/lineups/${id}`);
  };

  const handleCreateNew = () => {
    navigate('/lineups/new');
  };

  if (isLoading) {
    return (
      <div className="lineup-list lineup-list--loading">
        <div className="lineup-list__spinner">Loading lineups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lineup-list lineup-list--error">
        <div className="lineup-list__error-message">
          Error loading lineups: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!lineups || lineups.length === 0) {
    return (
      <div className="lineup-list lineup-list--empty">
        <div className="lineup-list__empty-state">
          <h3 className="lineup-list__empty-title">No Lineups Yet</h3>
          <p className="lineup-list__empty-text">
            Create your first lineup to get started.
          </p>
          <button
            className="lineup-list__create-btn"
            onClick={handleCreateNew}
          >
            Create Lineup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lineup-list">
      <div className="lineup-list__header">
        <h2 className="lineup-list__title">My Lineups</h2>
        <button
          className="lineup-list__create-btn"
          onClick={handleCreateNew}
        >
          + New Lineup
        </button>
      </div>

      <div className="lineup-list__grid">
        {lineups.map((lineup) => (
          <div key={lineup.id} className="lineup-card">
            <div className="lineup-card__header">
              <h3 className="lineup-card__name">{lineup.name}</h3>
              {lineup.gameDate && (
                <div className="lineup-card__date">
                  {new Date(lineup.gameDate).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="lineup-card__stats">
              <div className="lineup-card__stat">
                <span className="lineup-card__stat-label">Players:</span>
                <span className="lineup-card__stat-value">
                  {lineup.slots.filter((s) => s.player).length} / {lineup.slots.length}
                </span>
              </div>
              <div className="lineup-card__stat">
                <span className="lineup-card__stat-label">Score:</span>
                <span className="lineup-card__stat-value">
                  {lineup.projectedScore.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="lineup-card__actions">
              <button
                className="lineup-card__action lineup-card__action--view"
                onClick={() => handleView(lineup.id)}
                aria-label={`View ${lineup.name}`}
              >
                View
              </button>
              <button
                className="lineup-card__action lineup-card__action--edit"
                onClick={() => handleEdit(lineup.id)}
                aria-label={`Edit ${lineup.name}`}
              >
                Edit
              </button>
              <button
                className="lineup-card__action lineup-card__action--duplicate"
                onClick={() => handleDuplicate(lineup.id, lineup.name)}
                aria-label={`Duplicate ${lineup.name}`}
                disabled={duplicateMutation.isPending}
              >
                Duplicate
              </button>
              <button
                className="lineup-card__action lineup-card__action--delete"
                onClick={() => handleDelete(lineup.id, lineup.name)}
                aria-label={`Delete ${lineup.name}`}
                disabled={deleteMutation.isPending}
              >
                Delete
              </button>
            </div>

            <div className="lineup-card__metadata">
              <span className="lineup-card__created">
                Created {new Date(lineup.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
