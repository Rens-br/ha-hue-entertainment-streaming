import { css, html } from "lit";

import type { SceneParameter } from "./types";

/** A form control for one scene parameter; `set` gets the new value. */
export function renderField(
  name: string,
  p: SceneParameter,
  value: unknown,
  set: (value: unknown) => void,
) {
  const label = name.replace(/_/g, " ");
  if (p.type === "color") {
    return html`
      <label class="field">
        <span>${label}</span>
        <input
          type="color"
          .value=${toHex(value)}
          @input=${(e: Event) => set((e.target as HTMLInputElement).value)}
        />
      </label>
    `;
  }
  if (p.type === "number") {
    const num = Number(value);
    const min = p.min ?? 0;
    const max = p.max ?? Math.max(1, Number(p.default) * 2);
    const step = (max - min) / 100;
    return html`
      <label class="field">
        <span>${label}</span>
        <ha-slider
          min=${min}
          max=${max}
          step=${step}
          .value=${num}
          @input=${(e: Event) => set(Number((e.target as HTMLInputElement).value))}
        ></ha-slider>
        <span class="small num">${formatNumber(num)}</span>
      </label>
    `;
  }
  const options = p.options ?? [];
  if (options.length === 2 && options.every((o) => typeof o === "boolean")) {
    return html`
      <label class="field">
        <span>${label}</span>
        <ha-switch
          .checked=${Boolean(value)}
          @change=${(e: Event) => set((e.target as HTMLInputElement).checked)}
        ></ha-switch>
      </label>
    `;
  }
  return html`
    <label class="field">
      <span>${label}</span>
      <select
        @change=${(e: Event) => set(options[Number((e.target as HTMLSelectElement).value)])}
      >
        ${options.map(
          (o, i) =>
            html`<option value=${i} ?selected=${o === value}>${String(o)}</option>`,
        )}
      </select>
    </label>
  `;
}

export const fieldStyles = css`
  .field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .field span:first-child {
    color: var(--secondary-text-color);
    font-size: 14px;
    text-transform: capitalize;
    min-width: 90px;
  }
  .field ha-slider {
    flex: 1;
    min-width: 0;
  }
  .small {
    font-size: 13px;
  }
  .num {
    min-width: 36px;
    text-align: right;
  }
  select {
    font: inherit;
    color: inherit;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--divider-color);
    background: var(--secondary-background-color, transparent);
  }
  input[type="color"] {
    width: 44px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }
`;

/** Scene colours may be "#rrggbb", "#rrggbbBB" or [r, g, b(, brightness)]. */
function toHex(value: unknown): string {
  if (typeof value === "string" && /^#?[0-9a-f]{6}/i.test(value)) {
    return `#${value.replace("#", "").slice(0, 6)}`;
  }
  if (Array.isArray(value) && value.length >= 3) {
    return `#${value
      .slice(0, 3)
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(Number(v))))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  }
  return "#000000";
}

function formatNumber(n: number): string {
  return Math.abs(n) >= 10 ? n.toFixed(0) : String(Number(n.toFixed(2)));
}
