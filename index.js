import { read_bmd } from "./cultures/bmd.js";
import { read_palette } from "./cultures/pcx.js";
import { load_fs } from "./cultures/fs.js";
import { load_registry } from "./cultures/registry.js";

import { render } from './bmd_render.js';

var state = {
  /** @type {import('./cultures/pcx').RGBColor[] | null} */
  palette: null,
  /** @type {import('./cultures/bmd').BmdFile | null} */
  bmd_s_file: null,
  /** @type {import('./cultures/bmd').BmdFile | null} */
  bmd_file: null
};

/**
 * @param {DragEvent} e
 */
function cancel(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  return false;
}

function reload_frames_options(frames) {
  /** @type {HTMLSelectElement} */
  const frames_select = document.getElementById("frames_select");

  for (let i = 0; i < Math.min(frames.length, frames_select.options.length); i++) {
    frames_select.options[i].text = `Frame ${frames[i]}`;
    frames_select.options[i].value = frames[i];
  }

  if (frames_select.options.length < frames.length) {
    for (
      let i = frames_select.options.length;
      i < frames.length;
      i++
    ) {
      let option = document.createElement("option");
      option.text = `Frame ${frames[i]}`;
      option.value = frames[i].toString();
      frames_select.add(option);
    }
  } else {
    while (frames.length < frames_select.options.length) {
      frames_select.options.remove(frames.length);
    }
  }
}

/**
 * @param {File} file 
 */
async function load_object_file(file) {
  const fs = await load_fs(file);
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
  window.load_landscape = async (name) => {
    const lnd = registry.landscapes.get(name).def;
    const bmd_file = lnd.GfxBobLibs[0];
    const bmd_s_file = lnd.GfxBobLibs[1];
    const palette_name = lnd.GfxPalette[0];
    const palette_file = registry.palettes.get(palette_name).def.gfxfile;

    try {
      state.palette = await read_palette(fs.open(palette_file));
    } catch (ex) {
      console.error(ex);
    }

    reload_frames_options([... new Set(lnd.GfxFrames[lnd.GfxFrames.length - 1])]);
    state.bmd_file = await read_bmd(fs.open(bmd_file));
    state.bmd_s_file = await read_bmd(fs.open(bmd_s_file));

    document.getElementById("filename").innerText = bmd_file;

    renderSelectedFrame();
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

  if (files[0].name.endsWith('.bmd')) {
    load_bmd(files[0]);
  }

  return false;
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

/**
 * @param {string} frame_sequence
 */
window.animate_frames = function(frame_sequence) {
  let i = 0;
  let sequence = frame_sequence.split(' ').map(Number);

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });

  const animate = () => {
    if (i === Math.floor(i)) {
      render(state.bmd_file, state.palette, sequence[i], ctx);
    }

    i += 0.5;
    if (i === sequence.length) i = 0;
    requestAnimationFrame(animate);
  }

  return requestAnimationFrame(animate);
}


function onWindowLoad() {
  let body = document.body;

  // Tells the browser that we *can* drop on this target
  body.addEventListener("dragover", cancel);
  body.addEventListener("dragover", cancel);
  body.addEventListener("dragenter", cancel);
  body.addEventListener("drop", onDrop);

  let renderBtn = document.getElementById("renderBtn");
  const frames_select = document.getElementById("frames_select");
  const landscapes_select = document.getElementById("landscapes_select");

  renderBtn.addEventListener("click", renderSelectedFrame);
  frames_select.addEventListener("change", renderSelectedFrame);
  landscapes_select.addEventListener("change", (e) => window.load_landscape(e.target.value));
}

window.addEventListener("load", onWindowLoad);
