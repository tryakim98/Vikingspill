import { download } from "./files";
import type { ReactNode } from "react";
import type { GameStore, Snapshot } from "./store";
import "./classroom.css";
export function Button({
  children,
  onClick,
  disabled,
  secondary = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  secondary?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cg-button ${secondary ? "cg-secondary" : ""}`}
    >
      {children}
    </button>
  );
}
export function Panel({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="cg-panel">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  maxLength = 2000,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="cg-field">
      {label}
      {multiline ? (
        <textarea
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required={required}
          rows={4}
        />
      ) : (
        <input
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required={required}
        />
      )}
    </label>
  );
}
export function SyncStatus({
  state,
  store,
  solo,
}: {
  state: Snapshot;
  store: GameStore;
  solo: boolean;
}) {
  return (
    <div
      className={`cg-sync ${state.error ? "cg-alert" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span>
        {state.error ??
          (state.pending
            ? `${state.pending} handling${state.pending === 1 ? "" : "er"} venter på ${solo ? "lokal lagring" : "bekreftelse fra serveren"}.`
            : solo
              ? "Øvingsøkt lagret på denne enheten."
              : state.connected
                ? "Tilkoblet. Alle handlinger er bekreftet."
                : "Frakoblet. Handlinger venter på enheten til forbindelsen er tilbake.")}
      </span>
      {state.error && (
        <div className="cg-actions">
          <Button secondary onClick={store.retry}>
            Prøv igjen
          </Button>
          {state.pending > 0 && (
            <Button secondary onClick={store.discard}>
              Forkast ventende handling
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
export function Shell({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <main className={`viking-screen cg-screen ${className}`}>
      <div className="cg-wrap">
        <header className="cg-header">
          <div>
            <p className="cg-eyebrow">Vikingenes kulturmøter</p>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </header>
        {children}
      </div>
    </main>
  );
}
export function Download({
  filename,
  value,
  children,
}: {
  filename: string;
  value: unknown;
  children: ReactNode;
}) {
  return (
    <Button
      secondary
      onClick={() =>
        download(
          filename,
          typeof value === "string" ? value : JSON.stringify(value, null, 2),
        )
      }
    >
      {children}
    </Button>
  );
}
