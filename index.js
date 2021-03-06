import { read_bmd } from "./cultures/bmd.js";
import { pcx_read_palette } from "./cultures/pcx.js";
import { load_fs } from "./cultures/fs.js";
import { load_registry } from "./cultures/registry.js";
import { read_map_data } from './cultures/map.js';

import { render } from './bmd_render.js';
import { pcx_read } from "./cultures/pcx.js";

var state = {
  /** @type {import('./cultures/pcx').RGBColor[] | null} */
  palette: null,
  /** @type {import('./cultures/bmd').BmdFile | null} */
  bmd_s_file: null,
  /** @type {import('./cultures/bmd').BmdFile | null} */
  bmd_file: null,

  animation_frame: 0,

  /** @type {import('./cultures/fs').CulturesFS | null} */
  fs: null,

  /** @type {import('./cultures/fs').CulturesFS | null} */
  custom_map: null,

  /** @type {File | null} */
  saved_game: null,
};

globalThis.state = state;

/**
 * @param {DragEvent} e
 */
function cancel(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  return false;
}

/**
 * 
 * @param {string} id 
 * @param {{ text: string; value: string; }[]} options 
 */
function reload_options(id, options) {
  /** @type {HTMLSelectElement} */
  const select = document.getElementById(id);

  for (let i = 0; i < Math.min(options.length, select.options.length); i++) {
    select.options[i].text = options[i].text;
    select.options[i].value = options[i].value;
  }
  
  if (select.options.length < options.length) {
    for (
      let i = select.options.length;
      i < options.length;
      i++
    ) {
      let option = document.createElement("option");
      option.text = options[i].text;
      option.value = options[i].value;
      select.add(option);
    }
  } else {
    while (options.length < select.options.length) {
      select.options.remove(options.length);
    }
  }
}

/**
 * @param {number[]} frames 
 */
function reload_frames_options() {
  const select = document.getElementById('frame_group_select');
  const frames = select.value.split(',').map(Number);

  reload_options('frames_select', frames.map(f => ({ text: `Frame ${f}`, value: f.toString() })));
  renderSelectedFrame();
}

/**
 * @param {File} file 
 */
async function load_object_file(file) {
  const fs = state.fs = await load_fs(file);
  const registry = await load_registry(fs);

  /** @type {HTMLSelectElement} */
  const landscapes_select = document.getElementById("landscapes_select");

  for (let name of registry.landscapes.keys()) {
    let option = document.createElement("option");
    option.text = name;
    option.value = name;
    landscapes_select.add(option);
  }

  /**
   * @param {string} name
   */
  globalThis.load_landscape = async (name) => {
    const lnd = state.lnd = registry.landscapes.get(name).def;
    const bmd_file = lnd.GfxBobLibs.bmd;
    const bmd_s_file = lnd.GfxBobLibs.shadow;
    const palette_name = lnd.GfxPalette[0];
    const palette_file = registry.palettes.get(palette_name).def.gfxfile;

    try {
      state.palette = await pcx_read_palette(fs.open(palette_file));
    } catch (ex) {
      console.error(ex);
    }

    reload_options('frame_group_select', Object.entries(lnd.GfxFrames).map(([i, frames]) => ({ text: i.toString(), value: frames.join(',') })));
    reload_frames_options(); // [... new Set(lnd.GfxFrames[Object.keys(lnd.GfxFrames)[0]])]);
    state.bmd_file = await read_bmd(fs.open(bmd_file));
    state.bmd_s_file = await read_bmd(fs.open(bmd_s_file));

    document.getElementById("filename").innerText = bmd_file;

    renderSelectedFrame();

    if (lnd.GfxLoopAnimation) {
      animate_frames();
    } else {
      cancelAnimationFrame(state.animation_frame);
    }
  }
}

/**
 * @param {DragEvent} e
 */
function onDrop(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  let dt = e.dataTransfer;
  let files = dt.files;
  document.getElementById("filename").innerText = files[0].name;

  if (files[0].name.endsWith('.lib')) {
    load_object_file(files[0]);
    return false;
  }

  if (files[0].name.endsWith('.c2m')) {
    load_fs(files[0]).then(custom_map => {
      state.custom_map = custom_map;
    }, ex => {
      console.error(ex);
    });
  }

  if (files[0].name.endsWith('.bmd')) {
    load_bmd(files[0]);
  }

  if (files[0].name.endsWith('.sav')) {
    state.saved_game = files[0];
  }

  return false;
}

function onFrameGroupChanged(e) {
  reload_frames_options();

  if (state.lnd.GfxLoopAnimation) {
    animate_frames();
  } else {
    cancelAnimationFrame(state.animation_frame);
  }
}

function renderSelectedFrame() {
  if (!state.bmd_file) return;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  /** @type {HTMLSelectElement} */
  const frames_select = document.getElementById("frames_select");
  const selected_frame = parseInt(frames_select.value);

  render(state.bmd_file, state.bmd_s_file, state.palette, selected_frame, ctx);
}

const animate_frames = function() {
  let i = 0;
  /** @type {HTMLSelectElement} */
  const frames_select = document.getElementById("frames_select");
  let sequence = Array.prototype.slice.call(frames_select.options).map(option => parseInt(option.value));

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  cancelAnimationFrame(state.animation_frame);

  const animate = () => {
    if (i === Math.floor(i)) {
      render(state.bmd_file, state.bmd_s_file, state.palette, sequence[i], ctx);
    }

    i += 0.5;
    if (i === sequence.length) i = 0;
    state.animation_frame = requestAnimationFrame(animate);
  }

  state.animation_frame = requestAnimationFrame(animate);
}

function onWindowLoad() {
  let body = document.body;

  // Tells the browser that we *can* drop on this target
  body.addEventListener("dragover", cancel);
  body.addEventListener("dragenter", cancel);
  body.addEventListener("drop", onDrop);

  /** @type {HTMLButtonElement} */
  let renderBtn = document.getElementById("renderBtn");
  /** @type {HTMLSelectElement} */
  const frames_select = document.getElementById("frames_select");
  /** @type {HTMLSelectElement} */
  const frame_group_select = document.getElementById("frame_group_select");
  /** @type {HTMLSelectElement} */
  const landscapes_select = document.getElementById("landscapes_select");

  renderBtn.addEventListener("click", renderSelectedFrame);
  frame_group_select.addEventListener("change", onFrameGroupChanged);
  frames_select.addEventListener("change", renderSelectedFrame);
  landscapes_select.addEventListener("change", (e) => globalThis.load_landscape(landscapes_select.value));
}

globalThis.addEventListener("load", onWindowLoad);

globalThis.load_map = async (path, section, t = (v, ...a) => v) => {
  const blob = state.fs?.open(path);
  if (!blob) return;

  const sections = await read_map_data(blob);
  return drawMap(sections, section, t);
}

globalThis.load_user_map = async (section, t = (v, ...a) => v) => {
  const blob = state.custom_map?.open('currentusermap\\map.dat');
  if (!blob) return;

  const sections = await read_map_data(blob);
  return drawMap(sections, section, t);
}

/**
 * @param {string} section
 */
globalThis.load_saved_game = async (section, t = (v, ...a) => v) => {
  if (!state.saved_game) return;

  const sections = await read_map_data(state.saved_game);
  return drawMap(sections, section, t);
}

const drawMap = async (sections, section, t = (v, ...a) => v) => {
  let { width, height } = sections.hoixzisl.content;

  if (
    [
      "hoixtlml",
      "hoixvlml",
      "hoixplml",
      "hoixocml",
      "hoixwtml",
      "hoixsmml",
      "hoixrpml",
      "hoixbwml",
      "hoixbbml",
      "hoixorml",
      "hoixbsml",
      "hoixoaml",
    ].includes(section)
  ) {
    width = width * 2;
    height = height * 2;
  }

  console.log(`${width} x ${height}`);

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  if (!ctx) throw new Error('Could not get 2d context');

  const data = sections[section].content.data;
  const range = new Set(Array.from(data).sort((a, b) => a - b));
  console.log(range);

  const max = data.reduce((max, v) => max >= v ? max : v, -Infinity);

  const colorMap = new Map();
  for (const x of range) {
    colorMap.set(x, Math.floor(Math.random() * 0xFFFFFF));
  }
  colorMap.set(0, 0);

  const image = ctx.createImageData(width, height);
  for (let i = 0; i < data.length; i++) {
    const mappedColor = colorMap.get(data[i]);
    const color = [
      mappedColor & 0xFF,
      (mappedColor >> 8) & 0xFF,
      (mappedColor >> 16) & 0xFF,
    ];

    image.data[4 * i + 0] = t(data[i], max, color[0]);
    image.data[4 * i + 1] = t(data[i], max, color[1]);
    image.data[4 * i + 2] = t(data[i], max, color[2]);
    image.data[4 * i + 3] = 0xFF;
  }

  const bmp = await createImageBitmap(image);

  ctx.imageSmoothingEnabled = false;
  ctx.scale(4, 4);
  ctx.drawImage(bmp, 0, 0);
  ctx.clearRect(bmp.width, 0, 1200, 900);
  ctx.clearRect(0, bmp.height, bmp.width, 900);
  // ctx?.scale(1, 1);

  return sections;
}

/**
 * @param {string} path
 */
globalThis.load_pcx = async (path) => {
  const blob = state.fs?.open(path);
  if (!blob) {
    throw new Error('File not found.');
  }

  const img = await pcx_read(blob);
  const bmp = await createImageBitmap(img);

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  ctx?.drawImage(bmp, 0, 0);
  ctx?.clearRect(bmp.width, 0, 1200, 900);
  ctx?.clearRect(0, bmp.height, bmp.width, 900);
}

globalThis.bmd_stats = async () => {
  if (!state.fs) return;

  /** @type {Record<string, { width: number; height: number; }>} */
  let stats = {};

  for (const fi of state.fs.ls()) {
    if (!fi.path.endsWith('.bmd') || fi.path.endsWith('_s.bmd')) continue;

    try {
      const bmd = await read_bmd(state.fs.open(fi.path));
      let bmd_s = null;

      if (state.fs.exists(fi.path.replace('.bmd', '_s.bmd')))
        bmd_s = await read_bmd(state.fs.open(fi.path.replace('.bmd', '_s.bmd')));

      stats[fi.path] = bmd.frames.reduce((s, f, i) => {
        if (f.width > s.width) s.width = f.width;
        if (f.len > s.height) s.height = f.len;

        return s;
      }, { width: 0, height: 0});

      if (bmd_s) {
        stats[fi.path] = bmd_s.frames.reduce((s, f) => {
          if (bmd_s) {
            if (f.width > s.width) s.width = f.width;
            if (f.len > s.height) s.height = f.len;
          }
          
          return s;
        }, stats[fi.path]);
      }
    } catch (ex) {
      console.error('Error while reading BMD file', fi.path);
      console.error(ex);
    }
  }

  console.table(stats);
}