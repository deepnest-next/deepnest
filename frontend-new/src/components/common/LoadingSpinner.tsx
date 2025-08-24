import { Component } from 'solid-js';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  class?: string;
}

const LoadingSpinner: Component<LoadingSpinnerProps> = (props) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3',
  };

  const sizeClass = sizeClasses[props.size || 'medium'];

  return (
    <div class={`inline-flex items-center justify-center ${props.class || ''}`}>
      <div
        class={`${sizeClass} border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      >
        <span class="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;