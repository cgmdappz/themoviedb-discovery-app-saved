import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageMovieRatingWidget from './AverageMovieRatingWidget';

const meta = {
  title: 'Dashboard/Note moyenne',
  component: AverageMovieRatingWidget,
  tags: ['autodocs'],
} satisfies Meta<typeof AverageMovieRatingWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Nominal: Story = {
  args: { state: { status: 'success', rating: 6.78 } },
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
