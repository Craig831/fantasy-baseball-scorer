/**
 * LineupEditorPage
 * Page for creating or editing a lineup
 * Wraps LineupEditor component with page layout
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { LineupEditor } from '../components/lineups/LineupEditor';

export const LineupEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== 'new';

  return (
    <div className="page page--lineup-editor">
      <div className="page__container">
        <header className="page__header">
          <h1 className="page__title">
            {isEditMode ? 'Edit Lineup' : 'Create New Lineup'}
          </h1>
          <p className="page__subtitle">
            {isEditMode
              ? 'Update your lineup name and player selections'
              : 'Build your dream team by selecting up to 25 players'}
          </p>
        </header>

        <main className="page__content">
          <LineupEditor lineupId={isEditMode ? id : undefined} />
        </main>
      </div>
    </div>
  );
};
