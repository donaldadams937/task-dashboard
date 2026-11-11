import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpIcon,
  Bars3Icon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  GlobeAltIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  PaperClipIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  CpuChipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  generateLocalResponse,
  isWebGPUSupported,
  prepareLocalModel,
} from './services/localAIService';
import { preloadPublicIdentity } from './services/knowledgeService';

const PROFILE_STORAGE = 'unbeltedtech.userProfile';

const promptCards = [
  {
    icon: LightBulbIcon,
    tone: 'violet',
    label: 'IDEATION',
    title: 'Concept Forge',
    prompt: 'Generate five unconventional product concepts for the future of remote collaboration.',
  },
  {
    icon: CodeBracketIcon,
    tone: 'blue',
    label: 'ENGINEERING',
    title: 'Build Lab',
    prompt: 'Create a responsive React component for a futuristic project status card.',
  },
  {
    icon: ChartBarIcon,
    tone: 'amber',
    label: 'INTELLIGENCE',
    title: 'Signal Scan',
    prompt: 'Analyze how to separate meaningful product signals from noisy analytics data.',
  },
  {
    icon: GlobeAltIcon,
    tone: 'green',
    label: 'EXPLORATION',
    title: 'World Builder',
    prompt: 'Design an immersive three-day city experience around food, art, and hidden places.',
  },
];

const previousChats = [
  'Project Nightfall',
  'Interface systems',
  'Market signal scan',
  'Prototype architecture',
];

function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark${compact ? ' brand-mark--compact' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState('UT Flash');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelStatus, setModelStatus] = useState('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMessage, setLoadMessage] = useState('');
  const [userProfile, setUserProfile] = useState(() => localStorage.getItem(PROFILE_STORAGE) ?? '');
  const [profileDraft, setProfileDraft] = useState('');
  const textareaRef = useRef(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  };

  useEffect(resizeTextarea, [prompt]);

  useEffect(() => {
    preloadPublicIdentity();
  }, []);

  useEffect(() => {
    if (!isWebGPUSupported()) return undefined;
    let active = true;

    const preloadTimer = setTimeout(() => {
      setModelStatus('loading');
      prepareLocalModel({
        model,
        onProgress: ({ progress, text }) => {
          if (!active) return;
          setLoadProgress(progress);
          setLoadMessage(text);
        },
      })
        .then(() => {
          if (active) setModelStatus('ready');
        })
        .catch(() => {
          if (active) setModelStatus('error');
        });
    }, 500);

    return () => {
      active = false;
      clearTimeout(preloadTimer);
    };
  }, [model]);

  const startNewChat = () => {
    setMessages([]);
    setPrompt('');
    setIsThinking(false);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    const value = prompt.trim();
    if (!value || isThinking) return;

    const conversation = messages;
    setMessages([...conversation, { role: 'user', content: value }]);
    setPrompt('');
    setIsThinking(true);

    try {
      setModelStatus((status) => status === 'ready' ? status : 'loading');
      const response = await generateLocalResponse({
        model,
        messages: conversation,
        prompt: value,
        onProgress: ({ progress, text }) => {
          setModelStatus('loading');
          setLoadProgress(progress);
          setLoadMessage(text);
        },
        onToken: (partialResponse) => {
          setIsThinking(false);
          setMessages([
            ...conversation,
            { role: 'user', content: value },
            { role: 'assistant', content: partialResponse, streaming: true },
          ]);
        },
        userProfile,
      });
      setMessages([
        ...conversation,
        { role: 'user', content: value },
        { role: 'assistant', content: response },
      ]);
      setModelStatus('ready');
    } catch (error) {
      setModelStatus('error');
      setMessages([
        ...conversation,
        { role: 'user', content: value },
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'The AI request failed. Please try again.',
          error: true,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const selectSuggestion = (value) => {
    setPrompt(value);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = async (content, index) => {
    await navigator.clipboard?.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const openSettings = () => {
    setProfileDraft(userProfile);
    setSettingsOpen(true);
    setSidebarOpen(false);
  };

  const saveProfile = () => {
    const nextProfile = profileDraft.trim();
    if (nextProfile) {
      localStorage.setItem(PROFILE_STORAGE, nextProfile);
    } else {
      localStorage.removeItem(PROFILE_STORAGE);
    }
    setUserProfile(nextProfile);
    setSettingsOpen(false);
  };

  return (
    <div className="app-shell" data-testid="app">
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <a className="brand" href="/" aria-label="Unbeltedtech home">
            <BrandMark />
            <span>UNBELTED<span className="brand-accent">//</span>TECH</span>
          </a>
          <button
            className="icon-button mobile-only"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon />
          </button>
        </div>

        <button className="new-chat-button" onClick={startNewChat}>
          <PlusIcon />
          <span>Initialize workspace</span>
        </button>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className="nav-item nav-item--active">
            <ChatBubbleLeftRightIcon />
            <span>Workspaces</span>
          </button>
          <button className="nav-item">
            <SparklesIcon />
            <span>Module library</span>
          </button>
        </nav>

        <div className="chat-history">
          <p>Active threads</p>
          {previousChats.map((chat) => (
            <button key={chat} className="history-item">
              <span>{chat}</span>
              <EllipsisHorizontalIcon />
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="nav-item">
            <QuestionMarkCircleIcon />
            <span>System docs</span>
          </button>
          <button className="nav-item" onClick={openSettings}>
            <Cog6ToothIcon />
            <span>Settings</span>
          </button>
          <div className="profile-card">
            <div className="profile-avatar">DA</div>
            <div>
              <strong>Donald Adams</strong>
              <span>Operator access</span>
            </div>
            <EllipsisHorizontalIcon />
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon />
          </button>

          <div className="model-picker">
            <button
              className="model-button"
              onClick={() => setModelOpen((open) => !open)}
              aria-expanded={modelOpen}
            >
              <span>{model}</span>
              <span className="model-badge">ONLINE</span>
              <ChevronDownIcon />
            </button>
            {modelOpen && (
              <div className="model-menu">
                {['UT Flash', 'UT Pro'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setModel(option);
                      setModelStatus('idle');
                      setLoadProgress(0);
                      setLoadMessage('');
                      setModelOpen(false);
                    }}
                  >
                    <span>
                      <strong>{option}</strong>
                      <small>{option === 'UT Pro' ? 'Higher quality / larger download' : 'Fast local responses'}</small>
                    </span>
                    {model === option && <CheckIcon />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <button className="icon-button search-button" aria-label="Search">
              <MagnifyingGlassIcon />
            </button>
            <button className="system-indicator" onClick={openSettings}>
              <span className={modelStatus === 'error' ? 'system-offline' : ''} />
              {modelStatus === 'ready' ? 'LOCAL AI READY' : modelStatus === 'loading' ? 'LOADING MODEL' : 'LOCAL AI'}
            </button>
            <div className="topbar-avatar" aria-label="User profile">DA</div>
          </div>
        </header>

        <section className={`conversation${messages.length ? ' conversation--active' : ''}`}>
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-mark">
                <BrandMark compact />
                <i className="orbit orbit--one" />
                <i className="orbit orbit--two" />
              </div>
              <p className="eyebrow"><span /> UNBELTED INTELLIGENCE SYSTEM / 01</p>
              <h1>Build beyond<br /><span>the obvious.</span></h1>
              <p className="welcome-copy">
                A modular intelligence workspace for turning raw thoughts into new systems, products, and possibilities.
              </p>

              <div className="suggestion-grid">
                {promptCards.map(({ icon: Icon, tone, label, title, prompt: cardPrompt }, index) => (
                  <button
                    key={title}
                    className="suggestion-card"
                    onClick={() => selectSuggestion(cardPrompt)}
                  >
                    <div className="card-topline">
                      <span className={`suggestion-icon suggestion-icon--${tone}`}><Icon /></span>
                      <span className="module-number">0{index + 1}</span>
                    </div>
                    <span className="module-label">{label}</span>
                    <strong>{title}</strong>
                    <span className="module-description">{cardPrompt}</span>
                    <ArrowUpIcon className="card-arrow" />
                  </button>
                ))}
              </div>
              <div className="capability-strip">
                <span>CONNECTED MODULES</span>
                <div><i /> Web intelligence</div>
                <div><i /> Code systems</div>
                <div><i /> Visual synthesis</div>
                <div><i /> Deep analysis</div>
              </div>
            </div>
          ) : (
            <div className="message-list" aria-live="polite">
              {messages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={`message message--${message.role}${message.error ? ' message--error' : ''}${message.streaming ? ' message--streaming' : ''}`}
                >
                  <div className="message-avatar">
                    {message.role === 'assistant' ? <BrandMark compact /> : 'DA'}
                  </div>
                  <div className="message-content">
                    <strong>{message.role === 'assistant' ? 'Unbeltedtech' : 'You'}</strong>
                    <p>{message.content}</p>
                    {message.role === 'assistant' && !message.streaming && (
                      <div className="message-actions">
                        <button aria-label="Copy response" onClick={() => copyMessage(message.content, index)}>
                          {copiedIndex === index ? <CheckIcon /> : <ClipboardDocumentIcon />}
                        </button>
                        <button aria-label="Good response"><HandThumbUpIcon /></button>
                        <button aria-label="Poor response"><HandThumbDownIcon /></button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {isThinking && (
                <div className="message message--assistant thinking">
                  <div className="message-avatar"><BrandMark compact /></div>
                  <div className="thinking-dots" aria-label="Unbeltedtech is thinking">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="composer-wrap">
          {modelStatus === 'loading' && (
            <div className="model-progress" role="status">
              <div>
                <span>INITIALIZING LOCAL MODEL</span>
                <strong>{Math.round(loadProgress * 100)}%</strong>
              </div>
              <div className="model-progress-track">
                <i style={{ width: `${Math.max(2, loadProgress * 100)}%` }} />
              </div>
              <p>{loadMessage || 'Preparing private on-device intelligence...'}</p>
            </div>
          )}
          <form className="composer" onSubmit={sendMessage}>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Transmit a thought, problem, or possibility..."
              rows="1"
              aria-label="Message Unbeltedtech"
            />
            <div className="composer-toolbar">
              <div>
                <button type="button" className="composer-tool" aria-label="Attach file">
                  <PaperClipIcon />
                </button>
                <button type="button" className="composer-tool tools-button">
                  <SparklesIcon />
                  <span>Modules</span>
                  <ChevronDownIcon />
                </button>
              </div>
              <div>
                <button type="button" className="composer-tool" aria-label="Use microphone">
                  <MicrophoneIcon />
                </button>
                <button
                  type="submit"
                  className="send-button"
                  disabled={!prompt.trim() || isThinking}
                  aria-label="Send message"
                >
                  <ArrowUpIcon />
                </button>
              </div>
            </div>
          </form>
          <p className="disclaimer">
            UNBELTEDTECH // HUMAN JUDGMENT REQUIRED FOR CRITICAL DECISIONS
          </p>
        </div>
      </main>

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="local-settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-modal-header">
              <div className="settings-modal-icon"><CpuChipIcon /></div>
              <button className="icon-button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}>
                <XMarkIcon />
              </button>
            </div>
            <p className="eyebrow"><span /> ON-DEVICE INTELLIGENCE</p>
            <h2 id="local-settings-title">Local AI core</h2>
            <p>
              Unbeltedtech runs privately on your device with WebGPU. No account, API key, or
              remote inference service is required.
            </p>
            <div className="local-model-details">
              <div>
                <span>WEBGPU</span>
                <strong className={isWebGPUSupported() ? 'supported' : 'unsupported'}>
                  {isWebGPUSupported() ? 'SUPPORTED' : 'NOT AVAILABLE'}
                </strong>
              </div>
              <div>
                <span>UT PRO</span>
                <strong>LLAMA 3.2 3B / ~2 GB</strong>
              </div>
              <div>
                <span>UT FLASH</span>
                <strong>QWEN3 0.6B / ~500 MB</strong>
              </div>
            </div>
            <label className="profile-label" htmlFor="personal-profile">Private personal profile</label>
            <textarea
              id="personal-profile"
              className="profile-editor"
              value={profileDraft}
              onChange={(event) => setProfileDraft(event.target.value)}
              placeholder="Add your role, business, interests, and goals so Unbeltedtech can personalize answers."
              rows="4"
            />
            <button className="save-key-button local-close-button" onClick={saveProfile}>Save and continue</button>
            <small>Model files are downloaded once and cached by your browser for future sessions.</small>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
