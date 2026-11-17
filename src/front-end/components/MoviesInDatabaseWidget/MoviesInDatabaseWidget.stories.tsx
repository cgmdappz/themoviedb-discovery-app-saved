import type { Meta, StoryObj } from '@storybook/react-vite';
import MoviesInDatabaseWidget from './MoviesInDatabaseWidget';

const meta = {
  title: 'Dashboard/Films en base',
  component: MoviesInDatabaseWidget,
  tags: ['autodocs'],
} satisfies Meta<typeof MoviesInDatabaseWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    state: { status: 'loading' },
  },
};

export const Error: Story = {
  args: {
    state: { status: 'error' },
  },
};

export const Empty: Story = {
  args: {
    state: { status: 'success', count: 0 },
  },
};

export const WithMovies: Story = {
  args: {
    state: { status: 'success', count: 128 },
  },
};
