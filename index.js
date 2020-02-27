import { read_bmd } from "./cultures/bmd.js";
import { read_palette } from "./cultures/pcx.js";
import { load_fs } from "./cultures/fs.js";
import { load_registry } from "./cultures/registry.js";

import { render } from './bmd_render.js';

var state = {
  /** @type {import('./cultures/pcx').RGBColor[] | null} */
  palette: null,
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

/**
 * @param {Blob} blob
 */
async function load_bmd(blob) {
  state.bmd_file = await read_bmd(blob);

  /** @type {HTMLSelectElement} */
  const frames_select = document.getElementById("frames_select");

  if (frames_select.options.length < state.bmd_file.header.num_frames) {
    for (
      let i = frames_select.options.length;
      i < state.bmd_file.header.num_frames;
      i++
    ) {
      let option = document.createElement("option");
      option.text = `Frame ${i}`;
      option.value = i.toString();
      frames_select.add(option);
    }
  } else {
    while (state.bmd_file.header.num_frames < frames_select.options.length) {
      frames_select.options.remove(state.bmd_file.header.num_frames);
    }
  }
}

/**
 * @param {File} file 
 */
async function load_object_file(file) {
  const fs = await load_fs(file);
  const registry = await load_registry(fs);

  /**
   * @param {string} name
   */
  window.load_landscape = async (name) => {
    const lnd = registry.landscapes.get(name).def;
    const bmd_file = lnd.GfxBobLibs[0];
    const palette_name = lnd.GfxPalette[0];
    const palette_file = registry.palettes.get(palette_name).def.gfxfile[0];

    try {
      state.palette = await read_palette(fs.open(palette_file));
    } catch (ex) {
      console.error(ex);
    }

    await load_bmd(fs.open(bmd_file));
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

/** @param {Event} e */
async function onPaletteSelect(e) {
  /** @type {HTMLInputElement} */
  let palette_input = e.target;

  try {
    state.palette = await read_palette(palette_input.files[0]);
  } catch (ex) {
    console.error(ex);
  }
}

function renderSelectedFrame() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  /** @type {HTMLSelectElement} */
  const frames_select = document.getElementById("frames_select");
  const selected_frame = parseInt(frames_select.value);

  render(state.bmd_file, state.palette, selected_frame, ctx);
}

/**
 * @param {string} frame_sequence
 */
window.animate_frames = function(frame_sequence) {
  let i = 0;
  let sequence = frame_sequence.split(' ').map(Number);

  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

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

  /** @type {HTMLInputElement} */
  let palette_input = document.getElementById("palette");
  palette_input.addEventListener("change", onPaletteSelect);

  let renderBtn = document.getElementById("renderBtn");
  const frames_select = document.getElementById("frames_select");

  renderBtn.addEventListener("click", renderSelectedFrame);
  frames_select.addEventListener("change", renderSelectedFrame);
}

window.addEventListener("load", onWindowLoad);
