/**
 * Unit tests for Button component
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick} disabled>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByText('処理中...')).toBeInTheDocument();
  });

  it('should disable button when loading', () => {
    render(<Button isLoading>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should apply variant classes', () => {
    const { container: primary } = render(<Button variant="primary">Primary</Button>);
    expect(primary.querySelector('.bg-blue-600')).toBeInTheDocument();

    const { container: secondary } = render(<Button variant="secondary">Secondary</Button>);
    expect(secondary.querySelector('.bg-gray-200')).toBeInTheDocument();

    const { container: danger } = render(<Button variant="danger">Danger</Button>);
    expect(danger.querySelector('.bg-red-600')).toBeInTheDocument();
  });

  it('should apply size classes', () => {
    const { container: sm } = render(<Button size="sm">Small</Button>);
    expect(sm.querySelector('.px-3')).toBeInTheDocument();

    const { container: md } = render(<Button size="md">Medium</Button>);
    expect(md.querySelector('.px-4')).toBeInTheDocument();

    const { container: lg } = render(<Button size="lg">Large</Button>);
    expect(lg.querySelector('.px-6')).toBeInTheDocument();
  });
});
