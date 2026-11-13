"use client";
import { useEffect, useState, type CSSProperties } from "react";

export function RegistrationCelebration() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("veyra:registered") !== "1") return;
    } catch {
      return;
    }
    const frame = requestAnimationFrame(() => {
      try {
        sessionStorage.removeItem("veyra:registered");
      } catch {
        /* Nonessential storage. */
      }
      setVisible(true);
    });
    const timer = window.setTimeout(() => setVisible(false), 5000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);
  if (!visible) return null;
  return (
    <div className="registration-celebration">
      <div className="celebration-message" role="status">
        Добро пожаловать в Veyra! <span>Аккаунт создан — можно начинать.</span>
      </div>
      <div className="celebration-bursts" aria-hidden="true">
        {Array.from({ length: 54 }, (_, i) => {
          const angle = ((i % 18) * Math.PI) / 9;
          return (
            <i
              key={i}
              style={
                {
                  "--left": [25, 50, 75][Math.floor(i / 18)] + "%",
                  "--top": [32, 22, 38][Math.floor(i / 18)] + "%",
                  "--dx": Math.cos(angle) * (90 + (i % 4) * 28) + "px",
                  "--dy": Math.sin(angle) * (90 + (i % 4) * 28) + "px",
                  "--delay": Math.floor(i / 18) * 0.35 + "s",
                  "--color": ["#f0bc54", "#6bbf95", "#d18ad9", "#6cace4"][
                    i % 4
                  ],
                } as CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}
