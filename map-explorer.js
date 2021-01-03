import { load_fs } from "./cultures/fs.js";
import { load_registry } from "./cultures/registry.js";

var state = {
  /** @type {import('./cultures/fs').CulturesFS | null} */
  fs: null,

  selectedMap: null,

  selectedSection: null,
};

globalThis.state = state;


/**
 * @param {File} file 
 */
async function load_object_file(file) {
  const fs = state.fs = await load_fs(file);
  const registry = await load_registry(fs);

  const mapsUl = document.getElementById('maps')
  registry.list_maps().forEach(fi => {
    const li = document.createElement('li')
    const anchor = document.createElement('a')
    const path_parts = fi.path.split('\\')
    anchor.text = path_parts[path_parts.length - 1]

    li.appendChild(anchor)
    mapsUl.appendChild(li)
  })
}

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
 * @param {DragEvent} e
 */
function onDrop(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  let dt = e.dataTransfer;
  let files = dt.files;

  if (files[0].name.endsWith('.lib')) {
    load_object_file(files[0]);
    return false;
  }

  // if (files[0].name.endsWith('.c2m')) {
  //   load_fs(files[0]).then(custom_map => {
  //     state.custom_map = custom_map;
  //   }, ex => {
  //     console.error(ex);
  //   });
  // }

  // if (files[0].name.endsWith('.bmd')) {
  //   load_bmd(files[0]);
  // }

  // if (files[0].name.endsWith('.sav')) {
  //   state.saved_game = files[0];
  // }

  return false;
}

function onWindowLoad() {
  let body = document.body;

  // Tells the browser that we *can* drop on this target
  body.addEventListener("dragover", cancel);
  body.addEventListener("dragenter", cancel);
  body.addEventListener("drop", onDrop);
}

globalThis.addEventListener("load", onWindowLoad);
