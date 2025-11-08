/**
 * LineupEditor Component
 * Container component for creating and editing lineups
 * Handles lineup state, player selection, and validation
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLineup,
  createLineup,
  updateLineup,
  CreateLineupDto,
  UpdateLineupDto,
  LineupSlot as LineupSlotType,
} from '../../services/lineupService';
import { LineupSlot } from './LineupSlot';
import { useNavigate } from 'react-router-dom';

interface LineupEditorProps {
  lineupId?: string; // If provided, editing existing lineup
}

export const LineupEditor: React.FC<LineupEditorProps> = ({ lineupId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!lineupId;

  // State
  const [name, setName] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [slots, setSlots] = useState<LineupSlotType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing lineup if editing
  const { data: existingLineup, isLoading: isLoadingLineup } = useQuery({
    queryKey: ['lineup', lineupId],
    queryFn: () => getLineup(lineupId!),
    enabled: isEditMode,
  });

  // Initialize slots when lineup loads
  useEffect(() => {
    if (existingLineup) {
      setName(existingLineup.name);
      setGameDate(existingLineup.gameDate || '');
      setSlots(existingLineup.slots);
    } else if (!isEditMode) {
      // Create empty slots for new lineup
      const emptySlots: LineupSlotType[] = Array.from({ length: 25 }, (_, i) => ({
        id: `temp-${i}`,
        lineupId: '',
        slotOrder: i + 1,
        playerId: null,
        player: undefined,
        projectedScore: 0,
        actualScore: null,
        locked: false,
        createdAt: '',
        updatedAt: '',
      }));
      setSlots(emptySlots);
    }
  }, [existingLineup, isEditMode]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createLineup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
      navigate(`/lineups/${data.id}`);
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || error.message });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLineupDto }) =>
      updateLineup(id, dto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
      queryClient.invalidateQueries({ queryKey: ['lineup', lineupId] });
      navigate(`/lineups/${data.id}`);
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || error.message });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Lineup name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Lineup name must be 100 characters or less';
    }

    // Check for duplicate players
    const playerIds = slots
      .map((s) => s.playerId)
      .filter((id): id is string => id !== null);
    const uniquePlayerIds = new Set(playerIds);
    if (uniquePlayerIds.size !== playerIds.length) {
      newErrors.slots = 'Lineup cannot contain duplicate players';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditMode && lineupId) {
      // Update existing lineup
      const dto: UpdateLineupDto = {
        name,
        slots: slots.map((slot) => ({
          slotOrder: slot.slotOrder,
          playerId: slot.playerId,
        })),
      };
      updateMutation.mutate({ id: lineupId, dto });
    } else {
      // Create new lineup
      const dto: CreateLineupDto = {
        name,
        ...(gameDate && { gameDate }),
      };
      createMutation.mutate(dto);
    }
  };

  const handlePlayerRemove = (slotOrder: number) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.slotOrder === slotOrder ? { ...slot, playerId: null, player: undefined } : slot
      )
    );
  };

  const handlePlayerSelect = (slotOrder: number) => {
    // TODO: Open player selection modal
    // For now, just a placeholder
    alert(`Player selection for slot ${slotOrder} - to be implemented with player search modal`);
  };

  const handleCancel = () => {
    navigate('/lineups');
  };

  if (isLoadingLineup) {
    return (
      <div className="lineup-editor lineup-editor--loading">
        <div className="lineup-editor__spinner">Loading lineup...</div>
      </div>
    );
  }

  return (
    <div className="lineup-editor">
      <div className="lineup-editor__header">
        <h2 className="lineup-editor__title">
          {isEditMode ? 'Edit Lineup' : 'Create New Lineup'}
        </h2>
      </div>

      <form className="lineup-editor__form" onSubmit={handleSubmit}>
        <div className="lineup-editor__section">
          <div className="lineup-editor__form-group">
            <label htmlFor="lineup-name" className="lineup-editor__label">
              Lineup Name *
            </label>
            <input
              type="text"
              id="lineup-name"
              className="lineup-editor__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g., My Dream Team"
              aria-required="true"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <div className="lineup-editor__error">{errors.name}</div>
            )}
          </div>

          <div className="lineup-editor__form-group">
            <label htmlFor="lineup-date" className="lineup-editor__label">
              Game Date (Optional)
            </label>
            <input
              type="date"
              id="lineup-date"
              className="lineup-editor__input"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
            />
          </div>
        </div>

        <div className="lineup-editor__section">
          <h3 className="lineup-editor__section-title">
            Players ({slots.filter((s) => s.player).length} / 25)
          </h3>
          {errors.slots && (
            <div className="lineup-editor__error">{errors.slots}</div>
          )}
          <div className="lineup-editor__slots">
            {slots.map((slot) => (
              <LineupSlot
                key={slot.slotOrder}
                slot={slot}
                onPlayerSelect={handlePlayerSelect}
                onPlayerRemove={handlePlayerRemove}
                isEditable={true}
                showScore={false}
              />
            ))}
          </div>
        </div>

        {errors.submit && (
          <div className="lineup-editor__error lineup-editor__error--submit">
            {errors.submit}
          </div>
        )}

        <div className="lineup-editor__actions">
          <button
            type="button"
            className="lineup-editor__btn lineup-editor__btn--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="lineup-editor__btn lineup-editor__btn--submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : isEditMode
              ? 'Update Lineup'
              : 'Create Lineup'}
          </button>
        </div>
      </form>
    </div>
  );
};
