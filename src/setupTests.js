import React from 'react';
import { expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Add custom jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

if (!window.unbeltedTech) {
  window.unbeltedTech = {
    chooseProjectsRoot: vi.fn(),
    getSettings: vi.fn(),
    onAgentEvent: vi.fn(() => vi.fn()),
    openProject: vi.fn(),
    saveSettings: vi.fn(),
    startBuild: vi.fn(),
    stopBuild: vi.fn(),
  };
}

// Mock framer-motion to avoid animation-related test issues
vi.mock('framer-motion', () => {
  return {
    motion: {
      div: ({ children, ...props }) => React.createElement('div', props, children),
      button: ({ children, ...props }) => React.createElement('button', props, children),
      form: ({ children, ...props }) => React.createElement('form', props, children),
      p: ({ children, ...props }) => React.createElement('p', props, children),
    },
    AnimatePresence: ({ children }) => children,
  };
});
