import type { Meta, StoryObj } from '@storybook/react-vite';
import TopRatedMovieWidget from './TopRatedMovieWidget';

const posterUrl =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"%3E%3Crect width="200" height="300" fill="%232b4662"/%3E%3Ccircle cx="100" cy="120" r="52" fill="%23e5bd6a"/%3E%3Ctext x="100" y="235" text-anchor="middle" fill="white" font-family="sans-serif" font-size="24"%3EFILM%3C/text%3E%3C/svg%3E';

const meta = {
  title: 'Dashboard/Film le mieux noté',
  component: TopRatedMovieWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'La propriété state indique le chargement, l’erreur, l’absence de film noté ou le film sélectionné par la source. Pour success, movie contient title, year (ou null), rating sur 10 et posterUrl (ou null).',
      },
    },
  },
} satisfies Meta<typeof TopRatedMovieWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: {
    state: {
      status: 'success',
      movie: {
        title: 'Le voyage des étoiles',
        year: 2020,
        rating: 9.1,
        posterUrl,
      },
    },
  },
};

export const NoPoster: Story = {
  args: {
    state: {
      status: 'success',
      movie: {
        title: 'Le voyage des étoiles',
        year: 2020,
        rating: 9.1,
        posterUrl: null,
      },
    },
  },
};

export const LongTitleUnknownYear: Story = {
  args: {
    state: {
      status: 'success',
      movie: {
        title:
          'Un très long voyage extraordinaire à travers les étoiles et les galaxies',
        year: null,
        rating: 9.1,
        posterUrl,
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
