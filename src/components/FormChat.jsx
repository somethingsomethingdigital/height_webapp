import { useState, useRef, useEffect } from 'react';
import './FormCard.css';

const WEBHOOK_URL = 'https://hook.us1.make.com/431zm5huyqdtadg15wpiw5hmuyw5csiu';
const TYPING_SPEED = 15;
const tyDelay = (text) => Math.max(text.length * TYPING_SPEED + 300, 500);

const FILE_STEPS = [
  { key: 'rfp',           label: 'Upload the RFP' },
  { key: 'response_form', label: 'Upload the Response Form' },
  { key: 'specs',         label: 'Upload the specifications file' },
  { key: 'win_themes',    label: 'Upload the win themes file' },
  { key: 'style_guide',   label: 'Upload the writing style guide, if available' },
];

// ── Shared pieces ─────────────────────────────────────────────────────────────

function RobotIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <line x1="32" y1="6" x2="32" y2="14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="32" cy="5" r="3" fill="white"/>
      <rect x="14" y="14" width="36" height="26" rx="7" fill="white"/>
      <circle cx="24" cy="25" r="4" fill="#499281"/>
      <circle cx="40" cy="25" r="4" fill="#499281"/>
      <circle cx="25.5" cy="23.5" r="1.2" fill="white"/>
      <circle cx="41.5" cy="23.5" r="1.2" fill="white"/>
      <path d="M24 33 Q32 38 40 33" stroke="#499281" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <rect x="9" y="20" width="5" height="10" rx="2.5" fill="white"/>
      <rect x="50" y="20" width="5" height="10" rx="2.5" fill="white"/>
    </svg>
  );
}

function BotRow({ children }) {
  return (
    <div className="fc-row">
      <div className="fc-avatar"><RobotIcon size={18} /></div>
      <div className="fc-body">{children}</div>
    </div>
  );
}

function TypeBubble({ text }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    setShown('');
    setDone(false);
    const iv = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, TYPING_SPEED);
    return () => clearInterval(iv);
  }, [text]);
  return <p className={`fc-bubble${done ? '' : ' fc-typing'}`}>{shown}</p>;
}

function TypingDots() {
  return (
    <div className="fc-dots">
      <span/><span/><span/>
    </div>
  );
}

function OptionBtns({ options, onSelect, disabled }) {
  return (
    <div className="fc-opts">
      {options.map(o => (
        <button key={o} className="fc-opt-btn" disabled={disabled} onClick={() => onSelect(o)}>{o}</button>
      ))}
    </div>
  );
}

// ── Form steps ────────────────────────────────────────────────────────────────

function Form1({ onSubmit, disabled }) {
  const [v, setV] = useState({ ourClient: '', theirClient: '', projectTitle: '' });
  const [err, setErr] = useState('');
  const set = k => e => { setV(p => ({ ...p, [k]: e.target.value })); setErr(''); };
  const submit = () => {
    if (!v.ourClient.trim() || !v.theirClient.trim() || !v.projectTitle.trim()) {
      setErr('Please fill in all required fields.');
      return;
    }
    onSubmit(v);
  };
  return (
    <div className="fc-form">
      <div className="fc-field">
        <label className="fc-label">Our client name <span className="fc-req">*</span></label>
        <input type="text" value={v.ourClient} onChange={set('ourClient')} disabled={disabled} autoComplete="off" />
      </div>
      <div className="fc-field">
        <label className="fc-label">Their client name <span className="fc-req">*</span></label>
        <input type="text" value={v.theirClient} onChange={set('theirClient')} disabled={disabled} autoComplete="off" />
      </div>
      <div className="fc-field">
        <label className="fc-label">Project title <span className="fc-req">*</span></label>
        <input type="text" value={v.projectTitle} onChange={set('projectTitle')} disabled={disabled} autoComplete="off" />
      </div>
      {err && <p className="fc-err">{err}</p>}
      <button className="fc-next-btn" onClick={submit} disabled={disabled}>Next</button>
    </div>
  );
}

function Form2({ onSubmit, disabled }) {
  const [v, setV] = useState({ nonPrice: '', sme: '', evalCriteria: '', englishVariant: '' });
  const set = k => e => setV(p => ({ ...p, [k]: e.target.value }));
  return (
    <div className="fc-form">
      <div className="fc-field">
        <label className="fc-label">What have you been tasked to support?<br/><span className="fc-hint">e.g., Executive Summary, Case Studies</span></label>
        <textarea value={v.nonPrice} onChange={set('nonPrice')} disabled={disabled} />
      </div>
      <div className="fc-field">
        <label className="fc-label">Subject matter expertise<br/><span className="fc-hint">e.g., Road maintenance, bridge engineer</span></label>
        <textarea value={v.sme} onChange={set('sme')} disabled={disabled} />
      </div>
      <div className="fc-field">
        <label className="fc-label">Evaluation criteria<br/><span className="fc-hint">leave blank to use standard</span></label>
        <textarea value={v.evalCriteria} onChange={set('evalCriteria')} disabled={disabled} />
      </div>
      <div className="fc-field">
        <label className="fc-label">English variant</label>
        <select value={v.englishVariant} onChange={set('englishVariant')} disabled={disabled}>
          <option value="">Select one...</option>
          <option value="New Zealand English">New Zealand English</option>
          <option value="Australian English">Australian English</option>
        </select>
      </div>
      <button className="fc-next-btn" onClick={() => onSubmit(v)} disabled={disabled}>Next</button>
    </div>
  );
}

function FileStep({ stepDef, index, total, onAccept, onSkip, disabled }) {
  const [chosen, setChosen] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const accept = name => { setChosen(name); onAccept(name); };

  return (
    <div className="fc-form">
      <p className="fc-file-counter">{index + 1} of {total}</p>
      <input ref={inputRef} type="file" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) accept(e.target.files[0].name); e.target.value = ''; }} />
      <div
        className={`fc-drop${dragging ? ' dragging' : ''}${disabled || chosen ? ' locked' : ''}`}
        onClick={() => !disabled && !chosen && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!disabled && !chosen) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (!disabled && !chosen && e.dataTransfer.files?.[0]) accept(e.dataTransfer.files[0].name); }}
      >
        <svg className="fc-drop-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div>
          <div className="fc-drop-label">Drag & drop or click to upload</div>
        </div>
      </div>
      {chosen && (
        <div className="fc-file-chosen">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {chosen}
        </div>
      )}
      {!chosen && !disabled && (
        <button className="fc-skip-btn" onClick={onSkip}>Skip</button>
      )}
    </div>
  );
}

function ResultBox({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div className="fc-result">
      <button className={`fc-copy${copied ? ' ok' : ''}`} onClick={copy} title="Copy to clipboard">
        {copied
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        }
      </button>
      <pre className="fc-result-text">{text}</pre>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FormChat() {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  // Mutable refs — safe to read from stale closures inside timeouts
  const mounted   = useRef(true);
  const idRef     = useRef(0);
  const formData  = useRef({});
  const files     = useRef({});
  const fileStep  = useRef(0);

  // Forward refs for functions referenced before they're defined
  const pushFileStepFn = useRef(null);
  const startFlowFn    = useRef(null);

  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Core helpers ────────────────────────────────────────────────────────────

  const push = msg => {
    if (!mounted.current) return;
    setMessages(prev => [...prev, { id: ++idRef.current, ...msg }]);
  };

  const setLocked = predicate =>
    setMessages(prev => prev.map(m => predicate(m) ? { ...m, locked: true } : m));

  const pushText = (text, then) => {
    push({ type: 'text', text });
    if (then) setTimeout(() => { if (mounted.current) then(); }, tyDelay(text));
  };

  // ── File upload flow ────────────────────────────────────────────────────────

  const pushFileStep = idx => {
    if (idx >= FILE_STEPS.length) {
      pushText('All done! Generate your prompt.', () => push({ type: 'submit-btn' }));
      return;
    }
    pushText(FILE_STEPS[idx].label, () =>
      push({ type: 'file', idx, key: FILE_STEPS[idx].key })
    );
  };
  pushFileStepFn.current = pushFileStep;

  const advanceFile = key => {
    setLocked(m => m.type === 'file' && m.key === key);
    const next = ++fileStep.current;
    setTimeout(() => { if (mounted.current) pushFileStepFn.current(next); }, 450);
  };

  const handleFileAccept = (key, name) => { files.current[key] = name;  advanceFile(key); };
  const handleFileSkip   = key          => { files.current[key] = '';    advanceFile(key); };

  // ── Form submit handlers ────────────────────────────────────────────────────

  const handleForm1Submit = v => {
    formData.current = {
      our_client_name:  v.ourClient,
      their_client_name: v.theirClient,
      project_title:    v.projectTitle,
    };
    setLocked(m => m.type === 'form1');
    pushText("Great. Now let's add the response focus.", () => push({ type: 'form2' }));
  };

  const handleForm2Submit = v => {
    formData.current = {
      ...formData.current,
      non_price_attributes:    v.nonPrice,
      subject_matter_expertise: v.sme,
      evaluation_criteria:     v.evalCriteria,
      english_variant:         v.englishVariant,
    };
    setLocked(m => m.type === 'form2');
    fileStep.current = 0;
    pushText(
      "Now upload the reference files. You can drag & drop them or click to upload. Select skip for the ones you don't have.",
      () => pushFileStepFn.current(0)
    );
  };

  // ── Webhook submit ──────────────────────────────────────────────────────────

  const handleSubmit = () => {
    setLocked(m => m.type === 'submit-btn');
    push({ type: 'waiting' });

    const payload = {
      ...formData.current,
      rfp_filename:            files.current.rfp            || '',
      response_form_filename:  files.current.response_form  || '',
      specifications_filename: files.current.specs          || '',
      win_themes_filename:     files.current.win_themes     || '',
      style_guide_filename:    files.current.style_guide    || '',
    };

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.text())
      .then(text => {
        if (!mounted.current) return;
        setMessages(prev => prev.filter(m => m.type !== 'waiting'));
        push({ type: 'result', text });
        setTimeout(() => {
          if (!mounted.current) return;
          pushText("Like to start over?", () =>
            push({ type: 'opts', tag: 'restart', options: ['Yes, start over', "No, I'm done"] })
          );
        }, 800);
      })
      .catch(() => {
        if (!mounted.current) return;
        setMessages(prev => prev.filter(m => m.type !== 'waiting'));
        push({ type: 'text', text: 'Something went wrong. Please try again.' });
      });
  };

  // ── Conversation flow ───────────────────────────────────────────────────────

  const startFlow = () => {
    pushText(
      "Kia ora. 👋🏾 I'm your friendly AI prompt generator. Select the task you'd like a standard prompt for.",
      () => push({ type: 'opts', tag: 'intro', options: ['Bid Writing', 'Something Else'] })
    );
  };
  startFlowFn.current = startFlow;

  const handleIntroSelect = choice => {
    setLocked(m => m.tag === 'intro');
    if (choice === 'Bid Writing') {
      pushText("Let's start with the bid's main details.", () => push({ type: 'form1' }));
    } else {
      pushText("Thanks for stopping by. We'll have more options available soon. 👋🏾", () =>
        push({ type: 'ended' })
      );
    }
  };

  const handleRestartSelect = choice => {
    setLocked(m => m.tag === 'restart');
    if (choice === 'Yes, start over') {
      reset();
    } else {
      pushText("Ok, bye. 👋🏾", () => push({ type: 'ended' }));
    }
  };

  const reset = () => {
    formData.current = {};
    files.current = {};
    fileStep.current = 0;
    setMessages([]);
    setTimeout(() => { if (mounted.current) startFlowFn.current(); }, 300);
  };

  useEffect(() => { setTimeout(() => startFlowFn.current(), 500); }, []);

  // ── Render messages ─────────────────────────────────────────────────────────

  const renderMsg = msg => {
    switch (msg.type) {
      case 'text':
        return <BotRow key={msg.id}><TypeBubble text={msg.text} /></BotRow>;

      case 'opts':
        return (
          <BotRow key={msg.id}>
            <OptionBtns
              options={msg.options}
              disabled={msg.locked}
              onSelect={msg.tag === 'intro' ? handleIntroSelect : handleRestartSelect}
            />
          </BotRow>
        );

      case 'form1':
        return <BotRow key={msg.id}><Form1 onSubmit={handleForm1Submit} disabled={msg.locked} /></BotRow>;

      case 'form2':
        return <BotRow key={msg.id}><Form2 onSubmit={handleForm2Submit} disabled={msg.locked} /></BotRow>;

      case 'file':
        return (
          <BotRow key={msg.id}>
            <FileStep
              stepDef={FILE_STEPS[msg.idx]}
              index={msg.idx}
              total={FILE_STEPS.length}
              onAccept={name => handleFileAccept(msg.key, name)}
              onSkip={() => handleFileSkip(msg.key)}
              disabled={msg.locked}
            />
          </BotRow>
        );

      case 'submit-btn':
        return (
          <BotRow key={msg.id}>
            <button className="fc-next-btn" onClick={handleSubmit} disabled={msg.locked}>Submit</button>
          </BotRow>
        );

      case 'waiting':
        return <BotRow key={msg.id}><TypingDots /></BotRow>;

      case 'result':
        return (
          <BotRow key={msg.id}>
            <p className="fc-bubble" style={{ marginBottom: '0.5rem' }}>Here's your standard prompt</p>
            <ResultBox text={msg.text} />
          </BotRow>
        );

      case 'ended':
        return <p key={msg.id} className="fc-ended">— chat ended —</p>;

      default:
        return null;
    }
  };

  return (
    <div className="fc-page">
    <div className="fc-card">

      <header className="fc-header">
        <div className="fc-logo-wrap">
          <img
            src="https://raw.githubusercontent.com/somethingsomethingdigital/height-assistant/2064114894df8b84591dacdf228a2900d8885c71/height_logo.png"
            alt="Height"
          />
        </div>
        <button className="fc-restart-btn" onClick={reset} title="Restart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      </header>

      <div className="fc-scroll">
        <div className="fc-hero">
          <div className="fc-hero-icon">
            <svg viewBox="0 0 64 64" fill="none" width="42" height="42">
              <line x1="32" y1="6" x2="32" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="32" cy="5" r="2.5" fill="white"/>
              <rect x="14" y="14" width="36" height="26" rx="7" fill="white"/>
              <circle cx="24" cy="25" r="4" fill="#499281"/>
              <circle cx="40" cy="25" r="4" fill="#499281"/>
              <circle cx="25.5" cy="23.5" r="1.2" fill="white"/>
              <circle cx="41.5" cy="23.5" r="1.2" fill="white"/>
              <path d="M24 33 Q32 38 40 33" stroke="#499281" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <rect x="9" y="20" width="5" height="10" rx="2.5" fill="white"/>
              <rect x="50" y="20" width="5" height="10" rx="2.5" fill="white"/>
              <rect x="20" y="42" width="24" height="16" rx="5" fill="white" opacity="0.85"/>
              <circle cx="27" cy="50" r="2.5" fill="#499281" opacity="0.5"/>
              <circle cx="37" cy="50" r="2.5" fill="#499281" opacity="0.5"/>
            </svg>
          </div>
          <span className="fc-hero-title">Height AI Assistant</span>
          <span className="fc-hero-subtitle">
            Provide information about your bid to receive a standard AI prompt for use in ChatGPT projects.
          </span>
        </div>

        <div className="fc-messages">
          {messages.map(renderMsg)}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="fc-footer">
        <span className="fc-powered">
          Powered by <a href="https://www.somethingsomething.digital" target="_blank" rel="noopener">Something Something Digital</a>
        </span>
      </footer>

    </div>
    </div>
  );
}
