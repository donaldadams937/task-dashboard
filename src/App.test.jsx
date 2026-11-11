import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from './App';
import { generateGeminiResponse } from './services/geminiService';

vi.mock('./services/geminiService', () => ({
  generateGeminiResponse: vi.fn(),
}));

describe('Unbeltedtech', () => {
  beforeEach(() => {
    sessionStorage.clear();
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

  it('asks for a Gemini key before sending', () => {
    render(<App />);

    const composer = screen.getByRole('textbox');
    fireEvent.change(composer, { target: { value: 'Help me analyze a product trend' } });
    fireEvent.submit(composer.closest('form'));

    expect(screen.getByRole('dialog', { name: /Connect Gemini/i })).toBeInTheDocument();
    expect(generateGeminiResponse).not.toHaveBeenCalled();
  });

  it('sends a prompt and displays a Gemini response', async () => {
    sessionStorage.setItem('unbeltedtech.geminiApiKey', 'test-api-key');
    generateGeminiResponse.mockResolvedValue('This answer came from Gemini.');
    render(<App />);

    const composer = screen.getByRole('textbox');
    fireEvent.change(composer, { target: { value: 'Help me analyze a product trend' } });
    await act(async () => {
      fireEvent.submit(composer.closest('form'));
    });

    expect(screen.getByText('Help me analyze a product trend')).toBeInTheDocument();
    expect(screen.getByText('This answer came from Gemini.')).toBeInTheDocument();
    expect(generateGeminiResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-api-key',
        model: 'UT Pro',
        prompt: 'Help me analyze a product trend',
      }),
    );
  });
});
