import type { Meta, StoryObj } from '@storybook/react-vite';
import MostPopularMovieWidget from './MostPopularMovieWidget';

const posterUrl =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect width="200" height="300" fill="%232b4662"/%3E%3Ccircle cx="100" cy="120" r="52" fill="%23e5bd6a"/%3E%3Ctext x="100" y="235" text-anchor="middle" fill="white" font-family="sans-serif" font-size="24"%3EFILM%3C/text%3E%3C/svg%3E';

const movie = {
  title: 'Le voyage des étoiles',
  year: 2020,
  popularity: 1036.49,
  posterUrl,
};

const meta = {
  title: 'Dashboard/Film le plus populaire',
  component: MostPopularMovieWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'La propriété state indique le chargement, l’erreur, l’absence de film ou le film sélectionné par la source. Pour success, movie contient title, year (ou null), popularity (indice TMDB ou null) et posterUrl (ou null). La popularité n’est ni une note sur 10 ni un nombre de votes.',
      },
    },
  },
} satisfies Meta<typeof MostPopularMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: { state: { status: 'success', movie } },
};

export const NoPoster: Story = {
  args: { state: { status: 'success', movie: { ...movie, posterUrl: null } } },
};

export const UnknownPopularity: Story = {
  args: { state: { status: 'success', movie: { ...movie, popularity: null } } },
};

export const LongTitleUnknownYear: Story = {
  args: {
    state: {
      status: 'success',
      movie: {
        ...movie,
        title:
          'Un très long voyage extraordinaire à travers les étoiles et les galaxies',
        year: null,
      },
    },
  },
};

export const Loading: Story = {
  args: { state: { status: 'loading' } },
};

export const Empty: Story = {
  args: { state: { status: 'empty' } },
};

export const Error: Story = {
  args: { state: { status: 'error' } },
};
