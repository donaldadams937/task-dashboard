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
  XMarkIcon,
} from '@heroicons/react/24/outline';

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

const exampleResponses = {
  react: 'Here is a strong starting point: keep the component focused, model its variants as props, and use a small set of responsive layout primitives. I would also add keyboard-visible focus states and test the primary interaction with React Testing Library.',
  analyze: 'Start with a clear question, then compare a small number of reliable metrics over consistent time windows. Look for changes in direction, magnitude, and user segments—then validate each pattern against qualitative feedback before drawing a conclusion.',
  plan: 'I would shape the trip around one neighborhood per day, with a single anchor activity and plenty of room to explore. That keeps travel time low and makes it easier to discover local food, galleries, and quieter side streets along the way.',
  default: 'That is a great prompt. I can help turn it into a clear, practical plan with concrete next steps. Start by defining the outcome you want, the constraints that matter most, and what a successful result should look like.',
};

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
  const [model, setModel] = useState('UT Pro');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const textareaRef = useRef(null);
  const responseTimer = useRef(null);

  useEffect(() => () => clearTimeout(responseTimer.current), []);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  };

  useEffect(resizeTextarea, [prompt]);

  const startNewChat = () => {
    clearTimeout(responseTimer.current);
    setMessages([]);
    setPrompt('');
    setIsThinking(false);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  };

  const getResponse = (value) => {
    const normalized = value.toLowerCase();
    if (normalized.includes('react') || normalized.includes('component')) return exampleResponses.react;
    if (normalized.includes('analy') || normalized.includes('trend')) return exampleResponses.analyze;
    if (normalized.includes('trip') || normalized.includes('adventure')) return exampleResponses.plan;
    return exampleResponses.default;
  };

  const sendMessage = (event) => {
    event?.preventDefault();
    const value = prompt.trim();
    if (!value || isThinking) return;

    setMessages((current) => [...current, { role: 'user', content: value }]);
    setPrompt('');
    setIsThinking(true);

    responseTimer.current = setTimeout(() => {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: getResponse(value) },
      ]);
      setIsThinking(false);
    }, 650);
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
          <button className="nav-item">
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
                {['UT Pro', 'UT Flash'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setModel(option);
                      setModelOpen(false);
                    }}
                  >
                    <span>
                      <strong>{option}</strong>
                      <small>{option === 'UT Pro' ? 'Deep synthesis core' : 'Rapid response core'}</small>
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
            <div className="system-indicator"><span /> SYSTEM NOMINAL</div>
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
                <article key={`${message.role}-${index}`} className={`message message--${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'assistant' ? <BrandMark compact /> : 'DA'}
                  </div>
                  <div className="message-content">
                    <strong>{message.role === 'assistant' ? 'Unbeltedtech' : 'You'}</strong>
                    <p>{message.content}</p>
                    {message.role === 'assistant' && (
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
    </div>
  );
}

export default App;
