let $i = id => document.getElementById(id);
let $q = (addr, context) => Array.from((context || document).querySelectorAll(addr));
let $q1 = (addr, context) => (context || document).querySelector(addr);
let namespaces = {
  s: "http://www.w3.org/2000/svg",
};
function $m() {
  let args = [...arguments];
  let nstag = args.shift();
  let [ns, tag] = nstag.split(':', 2);
  if (!tag) {
    tag = ns;
    ns = null;
  }
  let text, rest;
  [tag, text] = tag.split(/ (.*)/);
  [tag, ...rest] = tag.split(/(?=[.#])/g);
  let ret = !ns ? document.createElement(tag) : document.createElementNS(namespaces[ns], tag);
  let id = rest.filter(i => i.startsWith('#')).map(i => i.slice(1)).join('');
  if (id) ret.id = id;
  ret.classList.add(...rest.filter(c => c.startsWith('.')).map(c => c.slice(1)));
  if (text) ret.innerText = text;
  for (let a of args) {
    if (typeof a === "string")
      ret.appendChild(document.createTextNode(a));
    else if (Array.isArray(a)) {
      for (let c of a) {
        if (typeof c === 'string') {
          ret.appendChild(document.createTextNode(c))
        } else {
          ret.appendChild(c);
        }
      }
    } else if (typeof a === "function") {
      ret.onclick = a;
    } else if (a instanceof Node) {
      ret.appendChild(a);
    } else {
      for (let k in a) {
        if (k === 'text') {
          ret.innerText = a[k];
        } else if (k.startsWith('on'))
          ret.addEventListener(k.substring(2), a[k]);
        else {
          if (k === 'selected' || k === 'disabled') {
            if (a[k]) ret.setAttribute(k, a[k]);
          } else {
            ret.setAttribute(k, a[k]);
          }
        }
      }
    }
  }
  return ret;
}
function sortKey(f) {
  return (a, b) => `${f(a)}`.localeCompare(`${f(b)}`);
}
function sortKeyN(f) {
  return (a, b) => f(a) - f(b);
}
function range(n) {
  return [...Array(Math.floor(n))].map((_, i) => i);
}
const sum = ls => ls.reduce((acc, v) => acc + v, 0);
const maxOf = (() => {
  return (ls, f) => {
    let acc;
    let best;
    for (let v of ls) {
      const e = f(v);
      if (!best || e > best) {
        best = e;
        acc = v;
      }
    }
    return { acc, best };
  }
})();
function $j(url) {
  if (Array.isArray(url)) {
    return Promise.all(url.map(u => fetch(u).then(r => r.json())));
  }
  return fetch(url).then(r => r.json());
}
function $jp(url, body, method) {
  let blob = body instanceof Blob;
  return fetch(url, {
    method: method || 'POST',
    headers: blob ? {} : {'Content-Type': 'application/json'},
    body: blob ? body : JSON.stringify(body)
  }).then(r => r.json());
}