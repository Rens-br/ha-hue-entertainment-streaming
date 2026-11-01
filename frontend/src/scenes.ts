import { LitElement, css, html, nothing } from "lit";

import type { SceneInfo, SceneParameter } from "./types";

type Values = Record<string, unknown>;
type Point = { x: number; y: number; position: number[] };

/**
 * Scene list with play/stop and speed, and a parameter form generated from the
 * selected scene. Fires "play" {scene, params}, "stop" and "speed" {speed}.
 */
class HueScenePanel extends LitElement {
  scenes: SceneInfo[] = [];
  playing: string | null = null;
  playingParams: Values | null = null;
  speed = 1;
  disabled = false;
  getScene?: (id: string) => Promise<SceneInfo>;
  subscribePreview?: (
    scene: unknown,
    positions: number[][],
    parameters: Record<string, unknown>,
    onColors: (colors: string[]) => void,
  ) => Promise<() => Promise<void>>;

  private selected?: string;
  private drafts: Record<string, Values> = {}; // per scene, edits not yet played
  private speedDraft?: number;
  private sceneJson = "";
  private previewError = "";
  private points: Point[] = [];
  private editTimer?: number;
  private previewRun = 0;
  private unsubscribePreview?: () => Promise<void>;

  private previewScene?: SceneInfo | undefined;

  static properties = {
    scenes: { attribute: false },
    playing: { attribute: false },
    playingParams: { attribute: false },
    speed: { type: Number },
    disabled: { type: Boolean },
    getScene: { attribute: false },
    subscribePreview: { attribute: false },
    selected: { state: true },
    drafts: { state: true },
    speedDraft: { state: true },
    sceneJson: { state: true },
    previewError: { state: true },
  };

  private get current(): SceneInfo | undefined {
    const id = this.selected ?? this.playing ?? this.scenes[0]?.id;
    return this.scenes.find((s) => s.id === id);
  }

  /** Form values: your edits, else what is playing, else the scene's defaults. */
  private values(scene: SceneInfo): Values {
    const defaults = Object.fromEntries(
      Object.entries(scene.parameters).map(([k, p]) => [k, p.default]),
    );
    const playing = scene.id === this.playing ? (this.playingParams ?? {}) : {};
    return { ...defaults, ...playing, ...(this.drafts[scene.id] ?? {}) };
  }

  private setValue(scene: SceneInfo, name: string, value: unknown) {
    this.drafts = {
      ...this.drafts,
      [scene.id]: { ...(this.drafts[scene.id] ?? {}), [name]: value },
    };
    if (this.dialog?.open && this.previewScene) {
      const previewScene = this.previewScene;
      clearTimeout(this.editTimer);
      this.editTimer = window.setTimeout(() => this.startPreview(previewScene), 300);
    }
  }

  private fire(type: string, detail: unknown = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  private play(scene: SceneInfo, params?: Values) {
    this.fire("play", { scene: scene.id, params });
  }

  private reloadScenes() {
    this.fire("reload-scenes");
  }

  private downloadScene(scene: SceneInfo) {
    this.fire("download-scene", { scene: scene.id });
  }

  private uploadScene() {
    const input = this.shadowRoot?.getElementById("scene-upload") as HTMLInputElement;
    input?.click();
  }

  private get dialog(): HTMLDialogElement | null | undefined {
    return this.shadowRoot?.querySelector("dialog");
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopPreview();
  }

  private async openDialog(scene: SceneInfo) {
    this.dialog?.showModal();
    this.sceneJson = "";
    this.previewError = "";
    this.layoutPreviewGrid();
    this.drawPreview();
    const json = await this.getScene?.(scene.id);
    this.sceneJson = JSON.stringify(json, null, 2);
    this.startPreview(json);
  }

  private closeDialog() {
    this.dialog?.close();
  }

  private onEdit(text: string) {
    clearTimeout(this.editTimer);
    this.editTimer = window.setTimeout(() => {
      try {
        this.startPreview(JSON.parse(text));
      } catch (err) {
        this.previewError = (err as Error).message;
      }
    }, 300);
  }

  private async startPreview(scene: SceneInfo | undefined) {
    console.log("startPreview", scene);
    this.stopPreview();
    const run = this.previewRun;

    // only parameters the edited scene still has; the server rejects unknown ones
    const known = (scene as { parameters?: Values })?.parameters ?? {};
    const values = Object.fromEntries(
      Object.entries(this.previewScene ? this.values(this.previewScene) : {}).filter(
        ([name]) => name in known,
      ),
    );
    try {
      const unsubscribe = await this.subscribePreview?.(
        scene,
        this.points.map((p) => p.position),
        values,
        (colors) => this.drawPreview(colors),
      );
      if (run === this.previewRun) {
        this.unsubscribePreview = unsubscribe;
        this.previewError = "";
        this.previewScene = scene;
      } else unsubscribe?.();
    } catch (err) {
      if (run === this.previewRun) this.previewError = (err as Error).message;
    }
  }

  private stopPreview() {
    clearTimeout(this.editTimer);
    this.previewRun++;
    this.unsubscribePreview?.();
    this.unsubscribePreview = undefined;
  }

  private get previewCanvas(): HTMLCanvasElement | null | undefined {
    return this.shadowRoot?.getElementById("scene-preview") as HTMLCanvasElement;
  }

  /** Dots for the floor and two back walls, with their Hue position (-1..1). */
  private layoutPreviewGrid() {
    const canvas = this.previewCanvas;
    if (!canvas) return;

    const floorSize = 16;
    const wallHeight = 11;
    const gap = 8;

    const spacing = Math.min(
      (canvas.width - 2 * gap) / (2 * 0.866 * floorSize),
      (canvas.height - 2 * gap) / (floorSize + wallHeight - 0.5),
    );

    const ox = canvas.width / 2;
    const oy = canvas.height / 2;
    const project = (x: number, y: number, z: number): [number, number] => [
      ox + (x - z) * spacing * 0.866,
      oy + ((x + z - (floorSize - 1)) * 0.5 - y + (wallHeight - 1) / 2) * spacing,
    ];
    const toHue = (i: number, size: number) => (i / (size - 1)) * 2 - 1;

    const lo = -0.5;
    const far = floorSize - 0.5;
    const top = wallHeight - 0.5;
    this.planes = [
      {
        fill: "rgba(0, 0, 0, 0.14)", // floor
        corners: [
          project(lo, lo, lo),
          project(far, lo, lo),
          project(far, lo, far),
          project(lo, lo, far),
        ],
      },
      {
        fill: "rgba(0, 0, 0, 0.07)", // left wall
        corners: [
          project(lo, lo, lo),
          project(lo, lo, far),
          project(lo, top, far),
          project(lo, top, lo),
        ],
      },
      {
        fill: "rgba(0, 0, 0, 0.03)", // right wall
        corners: [
          project(lo, lo, lo),
          project(far, lo, lo),
          project(far, top, lo),
          project(lo, top, lo),
        ],
      },
    ];

    this.points = [];
    for (let x = 0; x < floorSize; x++)
      for (let y = 0; y < wallHeight; y++)
        for (let z = 0; z < floorSize; z++) {
          if (x && y && z) continue; // only draw back faces
          if ([x, y, z].filter((i) => i === 0).length > 1) continue; // skip corners

          const [px, py] = project(x, y, z);
          this.points.push({
            x: px,
            y: py,
            position: [toHue(x, floorSize), toHue(z, floorSize), toHue(y, wallHeight)],
          });
        }
    this.dotRadius = spacing * 0.3;
  }

  private dotRadius = 0;
  private planes: { fill: string; corners: [number, number][] }[] = [];

  private drawPreview(colors?: string[]) {
    const canvas = this.previewCanvas;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 1;
    for (const plane of this.planes) {
      ctx.fillStyle = plane.fill;
      ctx.beginPath();
      plane.corners.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    this.points.forEach((p, i) => {
      ctx.fillStyle = colors?.[i] ?? "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.dotRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private handleUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const scene = JSON.parse(reader.result as string);
        this.fire("upload-scene", { scene });
      } catch (err) {
        console.error("Failed to parse scene file", err);
      }
    };
    reader.readAsText(file);
  }

  render() {
    const scene = this.current;
    return html`
      <div class="grid">
        ${this.renderList()} ${scene ? this.renderForm(scene) : nothing}
      </div>
      ${this.renderDialog(scene)}
    `;
  }

  private renderDialog(scene?: SceneInfo) {
    const entries = Object.entries(this.previewScene?.parameters ?? scene?.parameters ?? {});
    const values = scene ? this.values(this.previewScene ?? scene) : {};
    return html`
      <dialog
        @close=${() => this.stopPreview()}
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this.closeDialog();
        }}
      >
        <div class="dialog-header">
          <span class="value">${scene?.name ?? ""}</span>
          <ha-icon-button .label=${"Close"} @click=${() => this.closeDialog()}>
            <ha-icon icon="mdi:close"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="dialog-content">
          <div>${scene?.description ?? ""}</div>
          <div class="dialog-panes">
            <div class="dialog-square">
              ${
                customElements.get("ha-code-editor")
                  ? html`<ha-code-editor
                      mode="yaml"
                      .value=${this.sceneJson}
                      @value-changed=${(e: CustomEvent<{ value: string }>) =>
                        this.onEdit(e.detail.value)}
                    ></ha-code-editor>`
                  : html`<textarea
                      .value=${this.sceneJson}
                      @input=${(e: Event) =>
                        this.onEdit((e.target as HTMLTextAreaElement).value)}
                    ></textarea>`
              }
            </div>
            <div class="preview-square">
              <canvas
                id="scene-preview"
                width="440"
                height="440"
                style="max-width: 100%"
              ></canvas>
            </div>
          </div>
          <div class="preview-settings">
            ${
              entries.length && this.previewScene
                ? html`<div class="preview-form">
                    ${entries.map(([name, p]) => this.field(this.previewScene!, name, p, values[name]))}
                  </div>`
                : html`<div class="secondary small">This scene has no settings.</div>`
            }
          </div>
          ${
            this.previewError
              ? html`<div class="preview-error">${this.previewError}</div>`
              : nothing
          }
        </div>
        <div class="row actions dialog-footer">
          <ha-button size="s" appearance="plain" @click=${() => this.closeDialog()}>
            Close
          </ha-button>
        </div>
      </dialog>
    `;
  }

  private renderList() {
    const speed = this.speedDraft ?? this.speed;
    return html`
      <input
        type="file"
        id="scene-upload"
        accept=".json"
        style="display: none"
        @change=${(e: Event) => this.handleUpload(e)}
      />
      <ha-card
        ><div class="card-content">
          <div class="row">
            <span class="value">Scenes</span>
            <span>
              <ha-button
                appearance="plain"
                variant="secondary"
                size="xs"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.reloadScenes();
                }}
              >
                <ha-icon icon="mdi:reload"></ha-icon>
              </ha-button>
              <ha-button
                appearance="filled"
                variant="brand"
                size="xs"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.uploadScene();
                }}
              >
                <ha-icon icon="mdi:upload"></ha-icon>
                Upload Scene
              </ha-button>
            </span>
          </div>
          <div class="list">
            ${this.scenes.map((s) => {
              const on = s.id === this.playing;
              return html`
                <div
                  class="scene ${on ? "on" : ""} ${
                    s.id === this.current?.id ? "selected" : ""
                  }"
                  @click=${() => (this.selected = s.id)}
                >
                  <div class="scene-text">
                    <div class="name">${s.name}</div>
                    ${
                      s.description
                        ? html`<div class="secondary small">${s.description}</div>`
                        : nothing
                    }
                  </div>
                  <span class="tag">${s.builtin ? "built-in" : "yours"}</span>
                  <ha-button
                    size="xs"
                    appearance=${on ? "accent" : "outlined"}
                    ?disabled=${this.disabled}
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      if (on) this.fire("stop");
                      else this.play(s, this.drafts[s.id] ? this.values(s) : undefined);
                    }}
                  >
                    ${on ? "Stop" : "Play"}
                  </ha-button>
                </div>
              `;
            })}
          </div>
          <label class="row speed">
            <span class="secondary small">Speed</span>
            <ha-slider
              min="0.1"
              max="4"
              step="0.1"
              .value=${speed}
              ?disabled=${this.disabled}
              @input=${(e: Event) =>
                (this.speedDraft = Number((e.target as HTMLInputElement).value))}
              @change=${(e: Event) => {
                this.fire("speed", {
                  speed: Number((e.target as HTMLInputElement).value),
                });
                this.speedDraft = undefined;
              }}
            ></ha-slider>
            <span class="small">${speed.toFixed(1)}×</span>
          </label>
        </div></ha-card
      >
    `;
  }

  private renderForm(scene: SceneInfo) {
    const entries = Object.entries(scene.parameters);
    const values = this.values(scene);
    return html`
      <ha-card
        ><div class="card-content">
          <div class="row">
            <span class="value">${scene.name}</span>
            <div class="row actions">
              <ha-icon-button
                .label=${"Download"}
                @click=${() => this.downloadScene(scene)}
              >
                <ha-icon icon="mdi:download"></ha-icon>
              </ha-icon-button>
              ${
                scene.builtin
                  ? nothing
                  : html`
                      <ha-button
                        size="xs"
                        appearance="plain"
                        variant="danger"
                        @click=${() => this.fire("delete-scene", { scene: scene.id })}
                      >
                        <ha-icon icon="mdi:delete"></ha-icon>
                        Delete</ha-button
                      >
                    `
              }
            </div>
          </div>
          ${
            entries.length
              ? html`<div class="form">
                  ${entries.map(([name, p]) => this.field(scene, name, p, values[name]))}
                </div>`
              : html`<div class="secondary small">This scene has no settings.</div>`
          }
          <div class="row actions">
            <ha-button
              size="s"
              appearance="plain"
              ?disabled=${!this.drafts[scene.id]}
              @click=${() => {
                const rest = { ...this.drafts };
                delete rest[scene.id];
                this.drafts = rest;
              }}
            >
              Reset
            </ha-button>
            <ha-button
              size="s"
              appearance="plain"
              @click=${() => this.openDialog(scene)}
            >
              Preview
            </ha-button>
            <ha-button
              size="s"
              appearance="accent"
              ?disabled=${this.disabled}
              @click=${() => this.play(scene, values)}
            >
              ${scene.id === this.playing ? "Apply" : "Play with these"}
            </ha-button>
          </div>
        </div></ha-card
      >
    `;
  }

  private field(scene: SceneInfo, name: string, p: SceneParameter, value: unknown) {
    const label = name.replace(/_/g, " ");
    const set = (v: unknown) => this.setValue(scene, name, v);
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
          @change=${(e: Event) =>
            set(options[Number((e.target as HTMLSelectElement).value)])}
        >
          ${options.map(
            (o, i) =>
              html`<option value=${i} ?selected=${o === value}>${String(o)}</option>`,
          )}
        </select>
      </label>
    `;
  }

  static styles = css`
    .card-content {
      padding: 16px;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
    .row,
    .field {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .value {
      font-size: 16px;
      font-weight: 500;
    }
    .secondary {
      color: var(--secondary-text-color);
    }
    .small {
      font-size: 13px;
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }
    .list {
      display: grid;
    }
    .scene {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border-top: 1px solid var(--divider-color);
      cursor: pointer;
    }
    .scene.selected {
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.08));
      border-radius: 8px;
    }
    .scene.on .name {
      color: var(--primary-color);
      font-weight: 500;
    }
    .scene-text {
      flex: 1;
      min-width: 0;
    }
    .tag {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    ha-icon-button,
    ha-button {
      --ha-icon-button-size: 24px;
      --mdc-icon-button-size: 24px;
      --mdc-icon-size: 16px;
    }
    .speed ha-slider {
      flex: 1;
      min-width: 0;
    }
    .form {
      display: grid;
      gap: 10px;
    }
    .preview-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 8px;
      column-rule: 1px solid var(--divider-color);
      column-gap: 16px;
    }
    .preview-settings {
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 8px;
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
    .num {
      min-width: 36px;
      text-align: right;
    }
    .actions {
      justify-content: flex-end;
      gap: 8px;
    }
    dialog {
      width: min(928px, calc(100vw - 32px)); /* two 440px panes, a 16px gap, padding */
      padding: 0;
      border: none;
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color, var(--primary-background-color));
      color: var(--primary-text-color);
      box-shadow: var(--ha-card-box-shadow, 0 8px 24px rgba(0, 0, 0, 0.3));
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 0;
    }
    .dialog-content {
      display: grid;
      gap: 12px;
      padding: 16px;
    }
    .dialog-panes {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 16px;
    }
    .dialog-square,
    .preview-square {
      width: 100%;
      aspect-ratio: 1;
      background: var(--primary-background-color);
      overflow: hidden;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }
    .dialog-square ha-code-editor {
      display: block;
      height: 100%;
      --code-mirror-height: 100%;
    }
    .dialog-footer {
      padding: 0 16px 16px;
    }
    .preview-error {
      color: var(--error-color);
    }
  `;
}

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

customElements.define("hue-scene-panel", HueScenePanel);
