import { memo } from 'react';

/**
 * SkipLinks component provides keyboard navigation shortcuts
 * Allows users to quickly jump to main content areas
 */
const SkipLinks = memo(() => {
  return (
    <nav aria-label="Skip navigation links" className="sr-only focus-within:not-sr-only">
      <ul className="fixed top-0 left-0 z-50 bg-blue-600 text-white p-2 space-y-1">
        <li>
          <a
            href="#main-content"
            className="block px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-white"
          >
            Skip to main content
          </a>
        </li>
        <li>
          <a
            href="#chat-input"
            className="block px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-white"
          >
            Skip to chat input
          </a>
        </li>
        <li>
          <a
            href="#recommendations"
            className="block px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-white"
          >
            Skip to recommendations
          </a>
        </li>
        <li>
          <a
            href="#filters"
            className="block px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded focus:outline-none focus:ring-2 focus:ring-white"
          >
            Skip to filters
          </a>
        </li>
      </ul>
    </nav>
  );
});

SkipLinks.displayName = 'SkipLinks';

export default SkipLinks;