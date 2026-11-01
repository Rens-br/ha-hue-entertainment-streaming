import { LitElement, css, html, nothing } from "lit";

import { fieldStyles, renderField } from "./fields";
import type { SceneParameter } from "./types";

type Values = Record<string, unknown>;
type SceneJson = {
  name?: string;
  description?: string;
  parameters?: Record<string, SceneParameter>;
};
type Point = { x: number; y: number; position: number[] };
type Plane = { fill: string; corners: [number, number][] };

const COS_30 = Math.sqrt(3) / 2;

/**
 * Dialog with a scene's JSON on the left and a live preview on a grid of the
 * floor and two walls on the right. Call open(sceneId, params).
 */
class HueSceneEditor extends LitElement {
  getScene?: (id: string) => Promise<SceneJson>;
  subscribePreview?: (
    scene: SceneJson,
    positions: number[][],
    params: Values,
    onColors: (colors: string[]) => void,
  ) => Promise<() => Promise<void>>;

  private scene?: SceneJson; // last scene that previewed fine
  private params: Values = {};
  private sceneJson = "";
  private previewError = "";
  private points: Point[] = [];
  private planes: Plane[] = [];
  private dotRadius = 0;
  private editTimer?: number;
  private previewRun = 0;
  private unsubscribePreview?: () => Promise<void>;

  static properties = {
    getScene: { attribute: false },
    subscribePreview: { attribute: false },
    scene: { state: true },
    params: { state: true },
    sceneJson: { state: true },
    previewError: { state: true },
  };

  async open(sceneId: string, params: Values = {}) {
    this.dialog?.showModal();
    this.scene = undefined;
    this.params = params;
    this.sceneJson = "";
    this.previewError = "";
    this.layoutPreviewGrid();
    this.drawPreview();
    const json = await this.getScene?.(sceneId);
    this.sceneJson = JSON.stringify(json, null, 2);
    if (json) this.startPreview(json);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopPreview();
  }

  private get dialog(): HTMLDialogElement | null | undefined {
    return this.shadowRoot?.querySelector("dialog");
  }

  private get previewCanvas(): HTMLCanvasElement | null | undefined {
    return this.shadowRoot?.getElementById("scene-preview") as HTMLCanvasElement;
  }

  private close() {
    this.dialog?.close();
  }

  /** Defaults of the edited scene with the controls' values on top. */
  private values(scene: SceneJson): Values {
    return Object.fromEntries(
      Object.entries(scene.parameters ?? {}).map(([name, p]) => [
        name,
        name in this.params ? this.params[name] : p.default,
      ]),
    );
  }

  private setValue(name: string, value: unknown) {
    this.params = { ...this.params, [name]: value };
    const scene = this.scene;
    if (!scene) return;
    clearTimeout(this.editTimer);
    this.editTimer = window.setTimeout(() => this.startPreview(scene), 300);
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

  private async startPreview(scene: SceneJson) {
    this.stopPreview();
    const run = this.previewRun;
    try {
      const unsubscribe = await this.subscribePreview?.(
        scene,
        this.points.map((p) => p.position),
        // only parameters the edited scene still has; the server rejects unknown ones
        this.values(scene),
        (colors) => this.drawPreview(colors),
      );
      if (run === this.previewRun) {
        this.unsubscribePreview = unsubscribe;
        this.previewError = "";
        this.scene = scene;
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

  /** Dots for the floor and two back walls, with their Hue position (-1..1). */
  private layoutPreviewGrid() {
    const canvas = this.previewCanvas;
    if (!canvas) return;

    const floorSize = 16;
    const wallHeight = 11;
    const margin = 8;

    const spacing = Math.min(
      (canvas.width - 2 * margin) / (2 * COS_30 * floorSize),
      (canvas.height - 2 * margin) / (floorSize + wallHeight - 0.5),
    );

    const ox = canvas.width / 2;
    const oy = canvas.height / 2;
    const project = (x: number, y: number, z: number): [number, number] => [
      ox + (x - z) * spacing * COS_30,
      oy + ((x + z - (floorSize - 1)) * 0.5 - y + (wallHeight - 1) / 2) * spacing,
    ];
    const toHue = (i: number, size: number) => (i / (size - 1)) * 2 - 1;

    // a shaded quad through four room corners; alpha sets how dark it is
    const plane = (alpha: number, ...corners: [number, number, number][]): Plane => ({
      fill: `rgba(0, 0, 0, ${alpha})`,
      corners: corners.map(([x, y, z]) => project(x, y, z)),
    });
    const lo = -0.5;
    const far = floorSize - 0.5;
    const top = wallHeight - 0.5;
    this.planes = [
      // floor
      plane(0.14, [lo, lo, lo], [far, lo, lo], [far, lo, far], [lo, lo, far]),
      // left wall
      plane(0.07, [lo, lo, lo], [lo, lo, far], [lo, top, far], [lo, top, lo]),
      // right wall
      plane(0.03, [lo, lo, lo], [far, lo, lo], [far, top, lo], [lo, top, lo]),
    ];

    this.points = [];
    for (let x = 0; x < floorSize; x++)
      for (let y = 0; y < wallHeight; y++)
        for (let z = 0; z < floorSize; z++) {
          // dots on exactly one plane: not inside the room, not on its edges
          if ([x, y, z].filter((i) => i === 0).length !== 1) continue;

          const [px, py] = project(x, y, z);
          this.points.push({
            x: px,
            y: py,
            position: [toHue(x, floorSize), toHue(z, floorSize), toHue(y, wallHeight)],
          });
        }
    this.dotRadius = spacing * 0.3;
  }

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

  render() {
    const scene = this.scene;
    return html`
      <dialog
        @close=${() => this.stopPreview()}
        @click=${(e: Event) => {
          if (e.target === e.currentTarget) this.close();
        }}
      >
        <div class="header">
          <span class="title">${scene?.name ?? ""}</span>
          <ha-icon-button .label=${"Close"} @click=${() => this.close()}>
            <ha-icon icon="mdi:close"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="content">
          <div>${scene?.description ?? ""}</div>
          <div class="panes">
            <div class="editor-pane">${this.renderEditor()}</div>
            <div class="preview-pane">
              <canvas id="scene-preview" width="440" height="440"></canvas>
            </div>
          </div>
          ${this.renderSettings()}
          ${
            this.previewError
              ? html`<div class="error">${this.previewError}</div>`
              : nothing
          }
        </div>
        <div class="footer">
          <ha-button size="s" appearance="plain" @click=${() => this.close()}>
            Close
          </ha-button>
        </div>
      </dialog>
    `;
  }

  private renderEditor() {
    return customElements.get("ha-code-editor")
      ? html`<ha-code-editor
          mode="yaml"
          .value=${this.sceneJson}
          @value-changed=${(e: CustomEvent<{ value: string }>) => this.onEdit(e.detail.value)}
        ></ha-code-editor>`
      : html`<textarea
          .value=${this.sceneJson}
          @input=${(e: Event) => this.onEdit((e.target as HTMLTextAreaElement).value)}
        ></textarea>`;
  }

  private renderSettings() {
    const scene = this.scene;
    const entries = Object.entries(scene?.parameters ?? {});
    const values = scene ? this.values(scene) : {};
    return html`
      <div class="settings">
        ${
          entries.length
            ? html`<div class="settings-form">
                ${entries.map(([name, p]) =>
                  renderField(name, p, values[name], (v) => this.setValue(name, v)),
                )}
              </div>`
            : html`<div class="secondary small">This scene has no settings.</div>`
        }
      </div>
    `;
  }

  static styles = [
    fieldStyles,
    css`
      .title {
        font-size: 16px;
        font-weight: 500;
      }
      .secondary {
        color: var(--secondary-text-color);
      }
      ha-icon-button,
      ha-button {
        --ha-icon-button-size: 24px;
        --mdc-icon-button-size: 24px;
        --mdc-icon-size: 16px;
      }
      /* two 440px panes, a 16px gap, padding */
      dialog {
        width: min(928px, calc(100vw - 32px));
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
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 16px 0;
      }
      .content {
        display: grid;
        gap: 12px;
        padding: 16px;
      }
      .panes {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 16px;
      }
      .editor-pane,
      .preview-pane {
        width: 100%;
        aspect-ratio: 1;
        background: var(--primary-background-color);
        overflow: hidden;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
      }
      .editor-pane ha-code-editor,
      .editor-pane textarea {
        display: block;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        --code-mirror-height: 100%;
      }
      .editor-pane textarea {
        border: none;
        padding: 8px;
        resize: none;
        font-family: var(--code-font-family, monospace);
        background: transparent;
        color: inherit;
      }
      .preview-pane canvas {
        max-width: 100%;
      }
      .settings-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 8px;
        column-gap: 16px;
        column-rule: 1px solid var(--divider-color);
      }
      .settings {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 8px;
      }
      .footer {
        display: flex;
        justify-content: flex-end;
        padding: 0 16px 16px;
      }
      .error {
        color: var(--error-color);
      }
    `,
  ];
}

customElements.define("hue-scene-editor", HueSceneEditor);
