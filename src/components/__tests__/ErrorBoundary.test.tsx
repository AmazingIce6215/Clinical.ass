import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// A component that throws an error when rendered
const BrokenComponent = () => {
  throw new Error('Test error');
};

const WorkingComponent = () => <div>I work correctly!</div>;

describe('ErrorBoundary', () => {
  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/i work correctly!/i)).toBeInTheDocument();
  });

  test('renders fallback UI when child throws an error', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/could not be displayed/i)).toBeInTheDocument();
    expect(screen.getByText(/reload the page/i)).toBeInTheDocument();
  });
});
