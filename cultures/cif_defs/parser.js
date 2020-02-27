import * as defs from './defs.js';

function naive_parser(section) {
  switch (section.name) {
    case 'text':
      return {
        name: 'text',
        items: section.items
      };
    default:
      const hash = section.items.reduce((hash, item) => {
        hash[item.key] = (typeof hash[item.key] === 'number') ? hash[item.key]++ : 0;
        return hash;
      }, /** @type {Record<String, number>} */({}));

      return {
        name: section.name,
        def: section.items.reduce((obj, item) => {
          obj[item.key] = literal_parser(item.value);
          return obj;
        }, /** @type {Record<String, string | number>} */({})) 
      };
  }
}

function literal_parser(value, { is_array, is_boolean } = {}) {
  const r = /(?:"([^"]+)")|([0-9]+)/g;

  const matches = value.match(r);

  if (matches) {
    const literals = matches.map(m => {
      if (m.startsWith('"')) return m.slice(1, m.length - 1);

      const n = parseInt(m);
      if (is_boolean) return Boolean(n);
      return n;
    });

    if (is_array) return literals;

    return literals[0];
  }
}

/**
 * @param {string} value 
 * @param {string[]} types 
 */
function map_parser(value, types) {
  const r_key = /^(?:"([^"]+)")|([0-9]+) /;
  const key = value.match(r_key)[1] || value.match(r_key)[2];

  const val = literal_parser(value.replace(r_key, ''), { is_array: types[1].endsWith('[]'), is_boolean: types[1] === 'boolean' });

  return [key, val];
}

function default_parser(section, def) {
  /** @type {Record<string, any>} */
  const val = {};

  for (const { key, value } of section.items) {
    const type = def[key];
    if (!type) {
      val[key] = value;
      continue;
    }

    switch (type) {
      case 'string':
      case 'number':
        val[key] = literal_parser(value, { is_array: false, is_boolean: false });
        break;
      case 'boolean':
        val[key] = literal_parser(value, { is_array: false, is_boolean: true });
        break;
      case 'string[]':
      case 'number[]':
        val[key] = literal_parser(value, { is_array: true, is_boolean: false });
        break;

      case 'number[][]':
      case 'string[][]':
        if (!Array.isArray(val[key])) val[key] = [];
        val[key].push(literal_parser(value, { is_array: true, is_boolean: false }));
        break;

      default:
        const r = /\[([a-z]+),\s*([a-z]+(?:\[\])?)\]/;
        const types = type.match(r);
        if (!types) throw new Error(`Invalid type declaration ${type}`);
        val[key] = map_parser(value, types.slice(1));
    }
  }

  return {
    name: section.name,
    def: val
  };
}

export function parse_section(section) {
  if (defs[section.name]) {
    return default_parser(section, defs[section.name]);
  }

  return naive_parser(section);
}
