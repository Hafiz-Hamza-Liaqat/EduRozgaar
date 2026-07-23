import { Component } from 'react';

/**
 * Prevents a single block render failure from breaking the page (C.6.4.9).
 */
export class BlockRenderErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    const { hasError } = this.state;
    const { preview, blockType, children } = this.props;

    if (hasError) {
      if (preview) {
        return (
          <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
            <p className="font-semibold">Unsupported Block</p>
            <p className="mt-1">Type: {blockType || 'unknown'}</p>
            <p className="mt-1 text-amber-800 dark:text-amber-300">This block is not yet available.</p>
          </div>
        );
      }
      return null;
    }

    return children;
  }
}

export function UnsupportedBlockPlaceholder({ blockType, preview }) {
  if (!preview) return null;
  return (
    <div className="rounded border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
      <p className="font-semibold">Unsupported Block</p>
      <p className="mt-1">Type: {blockType || 'unknown'}</p>
      <p className="mt-1 text-amber-800 dark:text-amber-300">This block is not yet available.</p>
    </div>
  );
}
