// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import MovieDashboardPage from './MovieDashboardPage';

afterEach(cleanup);

describe('MovieDashboardPage', () => {
  it('shows the movie dashboard heading and a no-widgets empty state', () => {
    // Arrange: render the dashboard route with its router context.
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MovieDashboardPage />
      </MemoryRouter>,
    );

    // Assert: the page is usable and explains that widgets are not configured.
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Tableau de bord des films',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Aucun widget configuré',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Les informations du tableau de bord apparaîtront ici lorsque des widgets seront disponibles.',
      ),
    ).toBeTruthy();
  });
});
