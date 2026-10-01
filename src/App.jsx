import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const bridge = window.unbeltedTech;

function Settings({ settings, onClose, onSave }) {
  const [form, setForm] = useState({ ...settings, apiKey: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const chooseRoot = async () => {
    const projectsRoot = await bridge.chooseProjectsRoot();
    if (projectsRoot) setForm((current) => ({ ...current, projectsRoot }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <motion.form
        className="settings-card"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        onSubmit={save}
      >
        <div className="settings-heading">
          <div>
            <span className="eyebrow">Configuration</span>
            <h2 id="settings-title">Connect OpenAI</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <label>
          OpenAI API key
          <input
            type="password"
            value={form.apiKey}
            onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
            placeholder={settings.hasApiKey ? 'Saved securely — enter to replace' : 'sk-proj-...'}
            autoComplete="off"
          />
        </label>
        <p className="field-help">Encrypted using your operating system credential protection and never sent to the UI again.</p>

        <label>
          Model
          <input
            value={form.model}
            onChange={(event) => setForm({ ...form, model: event.target.value })}
            placeholder="gpt-5-mini"
            required
          />
        </label>

        <label>
          Projects directory
          <div className="input-action">
            <input value={form.projectsRoot} readOnly />
            <button type="button" className="secondary-button" onClick={chooseRoot}>Browse</button>
          </div>
        </label>

        {error && <div className="error-banner" role="alert">{error}</div>}
        <div className="settings-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button compact" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function ActivityItem({ event }) {
  const labels = {
    list_files: 'Inspected project files',
    read_file: `Read ${event.input?.path || 'a file'}`,
    write_file: `Updated ${event.input?.path || 'a file'}`,
    run_command: `Ran ${event.input?.program || 'command'} ${(event.input?.args || []).join(' ')}`,
  };

  if (event.type === 'status') {
    return <div className="activity status"><span className="pulse" />{event.message}</div>;
  }
  if (event.type === 'tool') {
    return <div className="activity tool"><span className="activity-icon">›</span>{labels[event.name] || event.name}</div>;
  }
  if (event.type === 'tool-result' && event.failed) {
    return <div className="activity failed"><span className="activity-icon">!</span>{event.output}</div>;
  }
  return null;
}

function App() {
  const [settings, setSettings] = useState({
    model: 'gpt-5-mini',
    projectsRoot: '',
    hasApiKey: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [events, setEvents] = useState([]);
  const [running, setRunning] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!bridge) {
      setLoading(false);
      setError('UnbeltedTech must be opened as a desktop application.');
      return undefined;
    }

    bridge.getSettings()
      .then((loaded) => {
        setSettings(loaded);
        if (!loaded.hasApiKey) setSettingsOpen(true);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));

    return bridge.onAgentEvent((event) => {
      setEvents((current) => [...current, event]);
      if (event.type === 'completed') {
        setSummary(event.message);
        setRunning(false);
      }
      if (event.type === 'error' || event.type === 'stopped') {
        if (event.type === 'error') setError(event.message);
        setRunning(false);
      }
    });
  }, []);

  const latestStatus = useMemo(
    () => [...events].reverse().find((event) => event.type === 'status')?.message,
    [events],
  );

  const saveSettings = async (form) => {
    const saved = await bridge.saveSettings(form);
    setSettings(saved);
  };

  const startBuild = async (event) => {
    event.preventDefault();
    setError('');
    setSummary('');
    setEvents([]);

    if (!settings.hasApiKey) {
      setSettingsOpen(true);
      return;
    }

    setRunning(true);
    try {
      const nextJob = await bridge.startBuild({ prompt });
      setJob(nextJob);
    } catch (startError) {
      setError(startError.message);
      setRunning(false);
    }
  };

  const stopBuild = async () => {
    if (job) await bridge.stopBuild(job.jobId);
  };

  if (loading) {
    return <main className="loading-screen"><div className="brand-mark">U</div><span>Starting UnbeltedTech…</span></main>;
  }

  return (
    <div className="app-shell" data-testid="app">
      <header className="topbar">
        <a className="brand" href="#builder" aria-label="UnbeltedTech home">
          <span className="brand-mark">U</span>
          <span>Unbelted<span>Tech</span></span>
        </a>
        <div className="topbar-actions">
          <span className="model-pill"><span className="online-dot" />{settings.model}</span>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings">⚙</button>
        </div>
      </header>

      <main id="builder" className="workspace">
        <section className="hero">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <span className="eyebrow">Autonomous software studio</span>
            <h1>Describe it.<br /><span>Watch it become real.</span></h1>
            <p>UnbeltedTech plans, codes, tests, and repairs a complete application in a dedicated folder on your laptop.</p>
          </motion.div>

          <motion.form
            className="prompt-card"
            onSubmit={startBuild}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <label htmlFor="app-prompt">What should we build?</label>
            <textarea
              id="app-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Build a personal finance tracker with recurring transactions, monthly charts, CSV export, dark mode, and tests…"
              minLength={20}
              disabled={running}
              required
            />
            <div className="prompt-footer">
              <span>{prompt.length} characters</span>
              {running ? (
                <button className="stop-button" type="button" onClick={stopBuild}>Stop build</button>
              ) : (
                <button className="primary-button" type="submit">
                  Build application <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </motion.form>
        </section>

        {(running || events.length > 0 || error) && (
          <section className="build-panel" aria-live="polite">
            <div className="build-header">
              <div>
                <span className="eyebrow">{running ? 'Agent working' : summary ? 'Build complete' : 'Build stopped'}</span>
                <h2>{running ? latestStatus || 'Starting build' : summary ? 'Your application is ready' : 'Needs attention'}</h2>
              </div>
              {job?.workspace && (
                <button className="secondary-button" onClick={() => bridge.openProject(job.workspace)}>
                  Open project folder
                </button>
              )}
            </div>

            <div className="activity-list">
              {events.map((event, index) => <ActivityItem event={event} key={`${event.type}-${index}`} />)}
            </div>

            {summary && <div className="summary-card"><pre>{summary}</pre></div>}
            {error && <div className="error-banner" role="alert">{error}</div>}
          </section>
        )}

        <section className="capabilities" aria-label="Capabilities">
          <article><span>01</span><h3>Plans the architecture</h3><p>Turns an idea into a practical implementation path before writing code.</p></article>
          <article><span>02</span><h3>Builds in a sandbox</h3><p>Creates files and runs approved developer tools only inside a dedicated project folder.</p></article>
          <article><span>03</span><h3>Tests and self-repairs</h3><p>Runs builds and tests, reads failures, and iterates until the application works.</p></article>
        </section>
      </main>

      <AnimatePresence>
        {settingsOpen && (
          <Settings
            settings={settings}
            onClose={() => setSettingsOpen(false)}
            onSave={saveSettings}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
