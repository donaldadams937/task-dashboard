import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';
import { generateLocalResponse } from './services/localAIService';

vi.mock('./services/localAIService', () => ({
  generateLocalResponse: vi.fn(),
  isWebGPUSupported: vi.fn(() => true),
}));

describe('Unbeltedtech', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the AI welcome experience', () => {
    render(<App />);

    expect(screen.getByLabelText('Unbeltedtech home')).toBeInTheDocument();
    expect(screen.getByText(/Build beyond/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Message Unbeltedtech/i })).toBeInTheDocument();
  });

  it('fills the composer from a suggestion', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Concept Forge/i }));

    expect(screen.getByRole('textbox')).toHaveValue(
      'Generate five unconventional product concepts for the future of remote collaboration.',
    );
  });

  it('sends a prompt and displays a local AI response', async () => {
    generateLocalResponse.mockResolvedValue('This answer came from the local model.');
    render(<App />);

    const composer = screen.getByRole('textbox');
    fireEvent.change(composer, { target: { value: 'Help me analyze a product trend' } });
    await act(async () => {
      fireEvent.submit(composer.closest('form'));
    });

    expect(screen.getByText('Help me analyze a product trend')).toBeInTheDocument();
    expect(screen.getByText('This answer came from the local model.')).toBeInTheDocument();
    expect(generateLocalResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'UT Pro',
        prompt: 'Help me analyze a product trend',
        onProgress: expect.any(Function),
      }),
    );
  });
});
