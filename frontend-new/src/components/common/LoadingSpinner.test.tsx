import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default medium size', () => {
    render(() => <LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-8', 'h-8', 'border-2');
  });

  it('should render with small size', () => {
    render(() => <LoadingSpinner size="small" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-4', 'h-4', 'border-2');
  });

  it('should render with large size', () => {
    render(() => <LoadingSpinner size="large" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('w-12', 'h-12', 'border-3');
  });

  it('should apply custom class', () => {
    render(() => <LoadingSpinner class="custom-class" />);
    
    const container = screen.getByRole('status').parentElement!;
    expect(container).toHaveClass('custom-class');
  });

  it('should have proper accessibility attributes', () => {
    render(() => <LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    
    const hiddenText = screen.getByText('Loading...');
    expect(hiddenText).toHaveClass('sr-only');
  });

  it('should have spinning animation class', () => {
    render(() => <LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should have proper color classes', () => {
    render(() => <LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(
      'border-gray-300',
      'dark:border-gray-600',
      'border-t-blue-500',
      'dark:border-t-blue-400'
    );
  });
});