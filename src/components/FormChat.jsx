import { useState, useRef, useEffect } from 'react';
import './Chat.css';

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
  return <span className={done ? '' : 'fc-typing'}>{shown}</span>;
}

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
    <>
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
    </>
  );
}

function Form2({ onSubmit, disabled }) {
  const [v, setV] = useState({ nonPrice: '', sme: '', evalCriteria: '', englishVariant: '' });
  const [err, setErr] = useState('');
  const set = k => e => { setV(p => ({ ...p, [k]: e.target.value })); setErr(''); };
  const submit = () => {
    if (!v.englishVariant) { setErr('Please select an English variant.'); return; }
    onSubmit(v);
  };
  return (
    <>
      <div className="fc-field">
        <label className="fc-label">What have you been tasked to support?</label>
        <span className="fc-hint">e.g., Executive Summary, Case Studies.</span>
        <textarea value={v.nonPrice} onChange={set('nonPrice')} disabled={disabled} />
      </div>
      <div className="fc-field">
        <label className="fc-label">Subject matter expertise</label>
        <span className="fc-hint">e.g., Road maintenance, bridge engineer</span>
        <textarea value={v.sme} onChange={set('sme')} disabled={disabled} />
      </div>
      <div className="fc-field">
        <label className="fc-label">Evaluation criteria</label>
        <span className="fc-hint">Leave blank to use standard</span>
        <textarea value={v.evalCriteria} onChange={set('evalCriteria')} disabled={disabled} />
      </div>
      <div className="fc-field">
        <label className="fc-label">English variant <span className="fc-req">*</span></label>
        <select value={v.englishVariant} onChange={set('englishVariant')} disabled={disabled} required>
          <option value="">Select one…</option>
          <option value="New Zealand English">New Zealand English</option>
          <option value="Australian English">Australian English</option>
        </select>
      </div>
      {err && <p className="fc-err">{err}</p>}
      <button className="fc-next-btn" onClick={submit} disabled={disabled}>Next</button>
    </>
  );
}

function FileStep({ index, total, onAccept, onSkip, disabled }) {
  const [chosen, setChosen] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const accept = name => { setChosen(name); onAccept(name); };
  return (
    <>
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
        <div className="fc-drop-text">
          <span className="fc-drop-label">Drag & drop or click to upload</span>
          <span className="fc-drop-sub">{index + 1} of {total}</span>
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
    </>
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
      <div className="fc-result-text">{text}</div>
    </div>
  );
}

export default function FormChat() {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  const mounted        = useRef(true);
  const idRef          = useRef(0);
  const formData       = useRef({});
  const files          = useRef({});
  const fileStep       = useRef(0);
  const pushFileStepFn = useRef(null);
  const startFlowFn    = useRef(null);

  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleFileAccept = (key, name) => { files.current[key] = name; advanceFile(key); };
  const handleFileSkip   = key          => { files.current[key] = '';   advanceFile(key); };

  const handleForm1Submit = v => {
    formData.current = {
      our_client_name:   v.ourClient,
      their_client_name: v.theirClient,
      project_title:     v.projectTitle,
    };
    setLocked(m => m.type === 'form1');
    pushText("Great. Now let's add the response focus.", () => push({ type: 'form2' }));
  };

  const handleForm2Submit = v => {
    formData.current = {
      ...formData.current,
      non_price_attributes:     v.nonPrice,
      subject_matter_expertise: v.sme,
      evaluation_criteria:      v.evalCriteria,
      english_variant:          v.englishVariant,
    };
    setLocked(m => m.type === 'form2');
    fileStep.current = 0;
    pushText(
      "Now upload the reference files. You can drag & drop them or click to upload. Select skip for the ones you don't have.",
      () => pushFileStepFn.current(0)
    );
  };

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
      pushText("Ok, sure. Let's start with the bid's main details.", () => push({ type: 'form1' }));
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

  const BotMsg = ({ children }) => (
    <div className="message assistant">
      <div className="message-bubble">{children}</div>
    </div>
  );

  const CardMsg = ({ children }) => (
    <div className="message assistant">
      <div className="fc-form-card">{children}</div>
    </div>
  );

  const renderMsg = msg => {
    switch (msg.type) {
      case 'text':
        return <BotMsg key={msg.id}><TypeBubble text={msg.text} /></BotMsg>;

      case 'opts':
        return (
          <BotMsg key={msg.id}>
            <div className="fc-opts">
              {msg.options.map(o => (
                <button key={o} className="fc-opt-btn" disabled={msg.locked}
                  onClick={() => msg.tag === 'intro' ? handleIntroSelect(o) : handleRestartSelect(o)}>
                  {o}
                </button>
              ))}
            </div>
          </BotMsg>
        );

      case 'form1':
        return <CardMsg key={msg.id}><Form1 onSubmit={handleForm1Submit} disabled={msg.locked} /></CardMsg>;

      case 'form2':
        return <CardMsg key={msg.id}><Form2 onSubmit={handleForm2Submit} disabled={msg.locked} /></CardMsg>;

      case 'file':
        return (
          <CardMsg key={msg.id}>
            <FileStep
              index={msg.idx}
              total={FILE_STEPS.length}
              onAccept={name => handleFileAccept(msg.key, name)}
              onSkip={() => handleFileSkip(msg.key)}
              disabled={msg.locked}
            />
          </CardMsg>
        );

      case 'submit-btn':
        return (
          <BotMsg key={msg.id}>
            <button className="fc-next-btn" onClick={handleSubmit} disabled={msg.locked}>Submit</button>
          </BotMsg>
        );

      case 'waiting':
        return (
          <div key={msg.id} className="message assistant">
            <div className="message-bubble typing-bubble">
              <span /><span /><span />
            </div>
          </div>
        );

      case 'result':
        return (
          <CardMsg key={msg.id}>
            <p className="fc-result-intro">Here's your standard prompt</p>
            <ResultBox text={msg.text} />
          </CardMsg>
        );

      case 'ended':
        return <p key={msg.id} className="fc-ended">— chat ended —</p>;

      default:
        return null;
    }
  };

  return (
    <div className="chat-container">
      {messages.length > 0 && (
        <div className="chat-topbar">
          <button className="reset-btn" onClick={reset}>Restart</button>
        </div>
      )}

      <div className="messages">
        {messages.map(renderMsg)}
        <div ref={bottomRef} />
      </div>

      <div className="fc-powered-footer">
        <span>Powered by <a href="https://www.somethingsomething.digital" target="_blank" rel="noopener">Something Something Digital</a></span>
      </div>
    </div>
  );
}
