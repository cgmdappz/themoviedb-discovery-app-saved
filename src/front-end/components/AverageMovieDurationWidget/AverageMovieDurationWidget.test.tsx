// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AverageMovieDurationWidget from './AverageMovieDurationWidget';
import {
  Empty,
  Error,
  Loading,
  Nominal,
} from './AverageMovieDurationWidget.stories';

afterEach(cleanup);

describe('AverageMovieDurationWidget stories', () => {
  it('displays the average duration and its unit in the nominal story', () => {
    // Arrange and act: render the example shown in Storybook.
    render(<AverageMovieDurationWidget {...Nominal.args} />);

    // Assert: the heading, supplied value and unit are visible.
    expect(
      screen.getByRole('heading', { level: 2, name: 'Durée moyenne' }),
    ).toBeTruthy();
    expect(screen.getByText('107')).toBeTruthy();
    expect(screen.getByText('min')).toBeTruthy();
  });

  it.each([
    ['loading', Loading.args, 'status', 'Chargement de la durée moyenne…'],
    ['empty', Empty.args, 'status', 'Aucune durée de film disponible.'],
    ['error', Error.args, 'alert', 'La durée moyenne n’a pas pu être chargée.'],
  ] as const)(
    'displays the %s story without inventing a value',
    (_name, args, role, message) => {
      // Arrange and act: render the corresponding Storybook state.
      render(<AverageMovieDurationWidget {...args} />);

      // Assert: the accessible message replaces the duration value.
      expect(screen.getByRole(role).textContent).toBe(message);
      expect(screen.queryByText('0')).toBeNull();
      expect(screen.queryByText('min')).toBeNull();
    },
  );

  it('displays a supplied fractional average using French formatting', () => {
    // Arrange and act: render an average that is not a whole number.
    render(
      <AverageMovieDurationWidget
        state={{ status: 'success', minutes: 107.12345 }}
      />,
    );

    // Assert: the value is not truncated and keeps its unit.
    expect(screen.getByText('107,12345')).toBeTruthy();
    expect(screen.getByText('min')).toBeTruthy();
  });
});
