import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ThemeToggle from './ThemeToggle';

const meta = {
  title: 'Interface/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  args: {
    onToggle: fn(),
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'inline-flex',
          padding: 12,
          borderRadius: 16,
          background: 'linear-gradient(90deg, #0f3555, #1f6f88)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LightTheme: Story = {
  args: {
    theme: 'light',
  },
};

export const DarkTheme: Story = {
  args: {
    theme: 'dark',
  },
};
