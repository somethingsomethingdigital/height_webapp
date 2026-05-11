import { useState, useRef, useEffect } from 'react';
import './FormCard.css';

const STEPS = [
  { field: 'firstName', label: 'First name',    placeholder: 'e.g. Jane',            type: 'text'  },
  { field: 'lastName',  label: 'Last name',     placeholder: 'e.g. Smith',           type: 'text'  },
  { field: 'email',     label: 'Email address', placeholder: 'e.g. jane@example.com', type: 'email' },
];

export default function FormChat() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ firstName: '', lastName: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const current = STEPS[step];

  const validate = () => {
    const val = values[current.field].trim();
    if (!val) return 'This field is required.';
    if (current.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleChange = (e) => {
    setError('');
    setValues(v => ({ ...v, [current.field]: e.target.value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleNext(); }
  };

  const handleSubmit = () => setSubmitted(true);

  const handleReset = () => {
    setStep(0);
    setValues({ firstName: '', lastName: '', email: '' });
    setSubmitted(false);
    setError('');
  };

  if (submitted) {
    return (
      <div className="form-page">
        <div className="form-card success-card">
          <div className="success-icon">✓</div>
          <h2>All done!</h2>
          <p>Thanks, <strong>{values.firstName}</strong>. Your details have been submitted.</p>
          <button className="form-btn" onClick={handleReset}>Start over</button>
        </div>
      </div>
    );
  }

  // Review step
  if (step === STEPS.length) {
    return (
      <div className="form-page">
        <div className="form-card">
          <div className="form-progress">
            <span className="form-step-label">Review your details</span>
          </div>
          <h2 className="form-question">Does everything look right?</h2>
          <dl className="review-list">
            {STEPS.map(s => (
              <div key={s.field} className="review-row">
                <dt>{s.label}</dt>
                <dd>{values[s.field]}</dd>
              </div>
            ))}
          </dl>
          <div className="form-actions">
            <button className="form-btn-secondary" onClick={handleBack}>Back</button>
            <button className="form-btn" onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      </div>
    );
  }

  // Question card
  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-progress">
          <div className="form-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={`form-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
            ))}
          </div>
          <span className="form-step-label">Step {step + 1} of {STEPS.length}</span>
        </div>

        <label className="form-question" htmlFor="form-input">
          {current.label}
        </label>

        <input
          ref={inputRef}
          id="form-input"
          className={`form-input ${error ? 'form-input-error' : ''}`}
          type={current.type}
          placeholder={current.placeholder}
          value={values[current.field]}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoComplete={current.field === 'email' ? 'email' : 'off'}
        />

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          {step > 0 && (
            <button className="form-btn-secondary" onClick={handleBack}>Back</button>
          )}
          <button className="form-btn" onClick={handleNext}>
            {step === STEPS.length - 1 ? 'Review' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
