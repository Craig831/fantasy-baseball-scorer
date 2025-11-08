/**
 * LineupsPage
 * Main page for viewing all lineups
 * Displays LineupList component with page layout
 */

import React from 'react';
import { LineupList } from '../components/lineups/LineupList';

export const LineupsPage: React.FC = () => {
  return (
    <div className="page page--lineups">
      <div className="page__container">
        <header className="page__header">
          <h1 className="page__title">Lineups</h1>
          <p className="page__subtitle">
            Create and manage your fantasy baseball lineups.
            Scores are calculated using your active scoring configuration.
          </p>
        </header>

        <main className="page__content">
          <LineupList />
        </main>
      </div>
    </div>
  );
};
