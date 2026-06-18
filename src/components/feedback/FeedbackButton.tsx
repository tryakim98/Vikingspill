/**
 * FeedbackButton.tsx
 * Liten, diskret flytende gravyr-knapp (kun enspiller) som åpner et lite panel for
 * tilbakemelding. Additivt: dekker ikke spillinnhold, ingen kobling til spillflyt.
 * Panelet fanger kategori + fritekst; submitFeedback fester skjerm-konteksten og
 * skriver lokalt + fire-and-forget til Firebase. Ingen navn/personopplysninger.
 */

import { useState } from 'react';
import Icon from '../decor/Icon';
import { submitFeedback, type FeedbackCategory } from '../../lib/feedback';

interface Props {
  /** Elevens valgte mannskapsrolle (domene-nøkkel) — festes på posten hvis kjent. */
  rolle?: string;
  className?: string;
}

const CATEGORIES: { key: FeedbackCategory; label: string; icon: string }[] = [
  { key: 'bug', label: 'Feil/bug', icon: 'warn' },
  { key: 'forvirrende', label: 'Forvirrende', icon: 'mist' },
  { key: 'forslag', label: 'Forslag', icon: 'spark' },
  { key: 'likte', label: 'Likte', icon: 'medal' },
];

export default function FeedbackButton({ rolle, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const reset = () => {
    setCategory(null);
    setText('');
    setSent(false);
  };
  const close = () => {
    setOpen(false);
    reset();
  };

  const canSend = category !== null && text.trim().length > 0;

  const send = () => {
    if (!canSend || category === null) return;
    submitFeedback({ kategori: category, kommentar: text, rolle });
    setSent(true);
  };

  return (
    <div className={`fixed bottom-4 left-4 z-[70] ${className}`}>
      {open && (
        <div
          role="dialog"
          aria-label="Send tilbakemelding"
          data-testid="feedback-panel"
          className="absolute bottom-12 left-0 w-[min(20rem,calc(100vw-2rem))] border-2 border-viking-gold/60 bg-viking-surface p-4"
          style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.45)' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-cinzel text-sm uppercase tracking-wide text-viking-gold-soft">Tilbakemelding</h3>
            <button
              onClick={close}
              aria-label="Lukk"
              data-testid="feedback-close"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-viking-gold/40 font-mono text-xs text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold"
            >
              ✕
            </button>
          </div>

          {sent ? (
            <div className="py-4 text-center" data-testid="feedback-thanks">
              <p className="font-cinzel text-base text-viking-gold">Takk! ✦</p>
              <p className="mt-1 font-inter text-xs text-viking-gold-soft/80">Tilbakemeldingen er lagret.</p>
              <button
                onClick={close}
                className="mt-3 rounded-md border-2 border-viking-gold/50 px-4 py-1.5 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold"
              >
                Lukk
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2" data-testid="feedback-categories">
                {CATEGORIES.map((c) => {
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      data-testid={`feedback-cat-${c.key}`}
                      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 font-inter text-xs transition-colors ${
                        active
                          ? 'border-viking-gold bg-viking-gold/15 text-viking-gold'
                          : 'border-viking-gold/25 text-viking-paper/80 hover:border-viking-gold/60'
                      }`}
                    >
                      <Icon name={c.icon} size={12} /> {c.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="Hva vil du si? (ingen navn)"
                data-testid="feedback-text"
                className="mb-3 w-full resize-none rounded-md border border-viking-gold/30 bg-viking-darkblue/40 px-3 py-2 font-inter text-sm text-viking-paper placeholder:text-viking-paper/40 focus:border-viking-gold/70 focus:outline-none"
              />

              <button
                onClick={send}
                disabled={!canSend}
                data-testid="feedback-send"
                className="w-full rounded-md border-2 border-viking-gold/60 bg-viking-darkblue/40 px-4 py-2 font-cinzel text-sm text-viking-gold-soft transition-colors hover:border-viking-gold hover:text-viking-gold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-label="Send tilbakemelding"
        data-testid="feedback-button"
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-viking-gold/60 bg-viking-surface text-viking-gold-soft transition-colors hover:border-viking-gold hover:text-viking-gold"
      >
        <Icon name="chat" size={18} />
      </button>
    </div>
  );
}
