import {
  FrameBufferRenderable,
  parseColor,
  RGBA,
  type ColorInput,
  type FrameBufferOptions,
  type RenderableOptions,
  type RenderContext,
} from '@opentui/core';
import { extend } from '@opentui/react';
import { rasterizeText, type RasterBitmap } from './rasterize';

const UPPER_HALF_BLOCK = '▀'; // ▀ — fg paints the top pixel, bg the bottom pixel
const TRANSPARENT = RGBA.fromValues(0, 0, 0, 0);

/** Coverage ramp for the "ascii" variant, from faintest to fully inked. */
const ASCII_RAMP = ' .:-=+*#%@';

/**
 * How the Geist glyphs are painted:
 * - "solid": smooth half-blocks — looks like the real font (default).
 * - "ascii": the glyphs shaded with ASCII characters — a retro ascii-art look.
 */
export type GeistTextVariant = 'solid' | 'ascii';

export interface GeistTextOptions extends Omit<RenderableOptions<GeistTextRenderable>, 'width' | 'height'> {
  /** The heading text to render in Geist. */
  text?: string;
  /** Text color (hex, rgba(), or a CSS color name). Defaults to white. */
  color?: ColorInput;
  /** Height of the heading in terminal rows. Each row is 2 rendered pixels. Defaults to 4. */
  rows?: number;
  /** Rendering style: "solid" (pure font) or "ascii" (ascii-art shading). Defaults to "solid". */
  variant?: GeistTextVariant;
}

/**
 * Renders a heading using the real Geist typeface.
 *
 * The glyph outlines are rasterized to a grayscale bitmap (see ./rasterize) and
 * painted here as Unicode half-blocks: every terminal cell carries two vertical
 * "pixels" — the foreground color is the top pixel, the background color is the
 * bottom one — so we get twice the vertical resolution and smooth, anti-aliased
 * Geist letterforms instead of a blocky prebuilt ASCII font.
 *
 * Use it just like <ascii-font>:
 *   <geist-text text="VCODE" color="gray" />
 */
export class GeistTextRenderable extends FrameBufferRenderable {
  private _text: string;
  private _color: RGBA;
  private _rows: number;
  private _variant: GeistTextVariant;
  private _raster: RasterBitmap;

  constructor(ctx: RenderContext, options: GeistTextOptions) {
    const text = options.text ?? '';
    const rows = Math.max(1, Math.floor(options.rows ?? 4));
    const raster = rasterizeText(text.length ? text : ' ', rows * 2);
    super(ctx, {
      flexShrink: 0,
      ...options,
      width: Math.max(1, raster.width),
      height: Math.max(1, Math.ceil(raster.height / 2)),
      respectAlpha: true,
    } as FrameBufferOptions);
    this._text = text;
    this._rows = rows;
    this._variant = options.variant ?? 'solid';
    this._color = parseColor(options.color ?? '#FFFFFF');
    this._raster = raster;
    this.draw();
  }

  get text(): string {
    return this._text;
  }
  set text(value: string) {
    if (value === this._text) return;
    this._text = value;
    this.reraster();
  }

  get color(): RGBA {
    return this._color;
  }
  set color(value: ColorInput) {
    this._color = parseColor(value);
    this.draw();
    this.requestRender();
  }

  get rows(): number {
    return this._rows;
  }
  set rows(value: number) {
    const next = Math.max(1, Math.floor(value));
    if (next === this._rows) return;
    this._rows = next;
    this.reraster();
  }

  get variant(): GeistTextVariant {
    return this._variant;
  }
  set variant(value: GeistTextVariant) {
    if (value === this._variant) return;
    this._variant = value;
    this.draw();
    this.requestRender();
  }

  private reraster() {
    this._raster = rasterizeText(this._text.length ? this._text : ' ', this._rows * 2);
    this.width = Math.max(1, this._raster.width);
    this.height = Math.max(1, Math.ceil(this._raster.height / 2));
    this.draw();
    this.requestRender();
  }

  private draw() {
    if (this.isDestroyed) return;
    const fb = this.frameBuffer;
    fb.clear(TRANSPARENT);
    if (this._variant === 'ascii') {
      this.drawAscii();
    } else {
      this.drawSolid();
    }
  }

  /** Smooth half-blocks: two vertical pixels per cell, alpha = coverage. */
  private drawSolid() {
    const { intensities, width, height } = this._raster;
    const fb = this.frameBuffer;
    const [r, g, b] = this._color.toInts();
    const rows = fb.height;
    for (let cy = 0; cy < rows; cy++) {
      const topRow = cy * 2;
      const botRow = topRow + 1;
      for (let cx = 0; cx < width; cx++) {
        const top = intensities[topRow * width + cx] ?? 0;
        const bot = botRow < height ? (intensities[botRow * width + cx] ?? 0) : 0;
        if (top === 0 && bot === 0) continue;
        fb.setCell(
          cx,
          cy,
          UPPER_HALF_BLOCK,
          RGBA.fromInts(r, g, b, Math.round(top * 255)),
          RGBA.fromInts(r, g, b, Math.round(bot * 255)),
        );
      }
    }
  }

  /** Ascii-art shading: one character per cell, picked from a coverage ramp. */
  private drawAscii() {
    const { intensities, width, height } = this._raster;
    const fb = this.frameBuffer;
    const fg = RGBA.fromInts(...(this._color.toInts() as [number, number, number, number]));
    const rows = fb.height;
    const last = ASCII_RAMP.length - 1;
    for (let cy = 0; cy < rows; cy++) {
      const topRow = cy * 2;
      const botRow = topRow + 1;
      for (let cx = 0; cx < width; cx++) {
        const top = intensities[topRow * width + cx] ?? 0;
        const bot = botRow < height ? (intensities[botRow * width + cx] ?? 0) : 0;
        const coverage = (top + bot) / 2;
        const level = Math.round(coverage * last);
        if (level <= 0) continue;
        fb.setCell(cx, cy, ASCII_RAMP[level]!, fg, TRANSPARENT);
      }
    }
  }
}

// Register <geist-text> as an intrinsic element, exactly like <ascii-font>.
extend({ 'geist-text': GeistTextRenderable });

declare module '@opentui/react' {
  interface OpenTUIComponents {
    'geist-text': typeof GeistTextRenderable;
  }
}
