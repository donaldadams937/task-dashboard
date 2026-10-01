import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const bridge = window.unbeltedTech;

describe('UnbeltedTech', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bridge.onAgentEvent.mockReturnValue(vi.fn());
    bridge.getSettings.mockResolvedValue({
      model: 'gpt-5-mini',
      projectsRoot: 'C:\\Projects',
      hasApiKey: true,
    });
  });

  it('starts an autonomous build from a detailed prompt', async () => {
    bridge.startBuild.mockResolvedValue({
      jobId: 'job-1',
      workspace: 'C:\\Projects\\weather',
    });
    const user = userEvent.setup();

    render(<App />);

    await screen.findByText('Describe it.');
    await user.type(
      screen.getByLabelText('What should we build?'),
      'Build a weather dashboard with saved cities and accessible charts.',
    );
    await user.click(screen.getByRole('button', { name: /build application/i }));

    await waitFor(() => {
      expect(bridge.startBuild).toHaveBeenCalledWith({
        prompt: 'Build a weather dashboard with saved cities and accessible charts.',
      });
    });
    expect(screen.getByText('Starting build')).toBeInTheDocument();
  });

  it('opens settings when no API key is configured', async () => {
    bridge.getSettings.mockResolvedValue({
      model: 'gpt-5-mini',
      projectsRoot: 'C:\\Projects',
      hasApiKey: false,
    });

    render(<App />);

    expect(await screen.findByRole('dialog', { name: 'Connect OpenAI' })).toBeInTheDocument();
  });
});
