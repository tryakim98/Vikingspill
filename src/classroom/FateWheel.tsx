import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PublicView } from "../domain/model";
import { WHEEL_FIELDS } from "../data/wheelFields";
import Icon from "../components/decor/Icon";
import { Button } from "./ui";
import "./fate-wheel.css";

const COLORS = [
  "#403e51",
  "#25464b",
  "#3d5040",
  "#652e2b",
  "#6d5737",
  "#454140",
];
const targetRotation = (fieldId: string) =>
  (360 - WHEEL_FIELDS.findIndex((f) => f.id === fieldId) * 60) % 360;
export default function FateWheel({
  spin,
  busy = false,
  onSpin,
  compact = false,
}: {
  spin: PublicView["wheel"];
  busy?: boolean;
  onSpin?: () => void;
  compact?: boolean;
}) {
  const reduced = useReducedMotion();
  const spinId = spin?.id;
  const fieldId = spin?.fieldId;
  const seen = useRef(spin?.id);
  const [rotation, setRotation] = useState(() =>
    spin ? targetRotation(spin.fieldId) : 0,
  );
  const [turning, setTurning] = useState(false);
  useEffect(() => {
    if (!spinId || !fieldId || spinId === seen.current) return;
    seen.current = spinId;
    const start = requestAnimationFrame(() => {
      setTurning(!reduced);
      setRotation(
        (old) =>
          old +
          (reduced ? 0 : 360 * 5) +
          ((targetRotation(fieldId) - (old % 360) + 360) % 360),
      );
    });
    const end = setTimeout(() => setTurning(false), reduced ? 0 : 4400);
    return () => {
      cancelAnimationFrame(start);
      clearTimeout(end);
    };
  }, [spinId, fieldId, reduced]);
  return (
    <div className={`fate-wheel ${compact ? "fate-wheel-compact" : ""}`}>
      <div className="fate-wheel-art" aria-label="Skjebnehjul med seks felt">
        <div className="fate-wheel-pointer" aria-hidden="true" />
        <div
          className="fate-wheel-rotor"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: reduced ? "0s" : "4.4s",
          }}
        >
          <svg
            viewBox="0 0 500 500"
            aria-hidden="true"
            className="fate-wheel-sectors"
          >
            <defs>
              <radialGradient id="wheel-shade">
                <stop offset="15%" stopColor="#000" stopOpacity=".45" />
                <stop offset="65%" stopColor="#fff" stopOpacity=".03" />
                <stop offset="100%" stopColor="#000" stopOpacity=".5" />
              </radialGradient>
            </defs>
            {WHEEL_FIELDS.map((f, i) => {
              const point = (angle: number) => [
                250 + 208 * Math.cos((angle * Math.PI) / 180),
                250 + 208 * Math.sin((angle * Math.PI) / 180),
              ];
              const a = point(-120 + i * 60),
                b = point(-60 + i * 60);
              return (
                <path
                  key={f.id}
                  d={`M250 250 L${a.join(" ")} A208 208 0 0 1 ${b.join(" ")} Z`}
                  fill={COLORS[i]}
                  stroke="#ac9471"
                  strokeWidth="1.3"
                />
              );
            })}
            <circle cx="250" cy="250" r="208" fill="url(#wheel-shade)" />
            <circle
              cx="250"
              cy="250"
              r="194"
              fill="none"
              stroke="#b8a282"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
          </svg>
          {WHEEL_FIELDS.map((f, i) => (
            <div
              key={f.id}
              className="fate-wheel-label"
              style={{ transform: `rotate(${i * 60}deg) translateY(-29cqw)` }}
            >
              <Icon name={f.icon} size={30} />
              <span>{f.shortLabel}</span>
            </div>
          ))}
          <img
            className="fate-wheel-rim"
            src="/game/wheel-bronze-rim.webp"
            alt=""
          />
        </div>
        <img
          className="fate-wheel-hub"
          src="/game/wheel-raven-hub.webp"
          alt=""
        />
      </div>
      {onSpin && (
        <Button disabled={busy || turning} onClick={onSpin}>
          {turning ? "Skjebnen snurrer …" : "Spinn skjebnehjulet"}
        </Button>
      )}
      <div className="fate-wheel-result" role="status" aria-live="polite">
        {turning ? (
          "Hjulet snurrer …"
        ) : spin ? (
          <>
            <h3>{WHEEL_FIELDS.find((f) => f.id === spin.fieldId)?.label}</h3>
            <p>{spin.text}</p>
          </>
        ) : (
          <p>Seks muligheter. Én felles skjebne.</p>
        )}
      </div>
    </div>
  );
}
