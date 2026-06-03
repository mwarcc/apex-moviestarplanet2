  // ─── API layer ────────────────────────────────────────────────────────────

  async function apiFetch(url, opts = {}) {
    const headers = { authorization: `Bearer ${state.accessToken}`, ...opts.headers };
    if (!opts.binary) headers['content-type'] = 'application/json';
    const res = await sf(url, { ...opts, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    if (opts.binary) return res.arrayBuffer();
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  const mspUrl  = path         => `${API_BASE}${path}`;
  const mspGet  = path         => apiFetch(mspUrl(path), { method: 'GET' });
  const mspPut  = (path, body) => apiFetch(mspUrl(path), { method: 'PUT',  body: JSON.stringify(body) });
  const mspPost = (path, body) => apiFetch(mspUrl(path), { method: 'POST', body: JSON.stringify(body) });

  async function mspGraphQL(endpoint, query, variables) {
    const res = await sf(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${state.accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables: JSON.stringify(variables) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async function mspGraphQLPersisted(endpoint, payload) {
    const res = await sf(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${state.accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async function messagingFetch(path, opts = {}) {
    const base = capturedMessagingBase ?? API_BASE;
    return apiFetch(`${base}${path}`, opts);
  }

  const messagingGet = path         => messagingFetch(path, { method: 'GET' });
  const messagingPut = (path, body) => messagingFetch(path, { method: 'PUT', body: JSON.stringify(body) });

  // ─── BSON encoding ────────────────────────────────────────────────────────

  const enc = new TextEncoder();

  function bsonCString(str) { return [...enc.encode(str), 0x00]; }
  function bsonString(str) {
    const bytes = enc.encode(str);
    const len   = bytes.length + 1;
    return [len & 0xff, (len >> 8) & 0xff, (len >> 16) & 0xff, (len >> 24) & 0xff, ...bytes, 0x00];
  }
  function bsonInt32(val) {
    val = val | 0;
    return [val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff];
  }
  function bsonEncodeValue(bytes, key, value) {
    if (value === null || value === undefined) { bytes.push(0x0A, ...bsonCString(key)); return; }
    if (typeof value === 'string') { bytes.push(0x02, ...bsonCString(key), ...bsonString(value)); return; }
    if (typeof value === 'number' && Number.isInteger(value)) { bytes.push(0x10, ...bsonCString(key), ...bsonInt32(value)); return; }
    if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
      const buf = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
      bytes.push(0x05, ...bsonCString(key), ...bsonInt32(buf.length), 0x00, ...buf);
      return;
    }
    if (Array.isArray(value)) {
      const arrDoc = Object.fromEntries(value.map((v, i) => [String(i), v]));
      bytes.push(0x04, ...bsonCString(key), ...bsonEncodeDoc(arrDoc));
      return;
    }
    if (typeof value === 'object') bytes.push(0x03, ...bsonCString(key), ...bsonEncodeDoc(value));
  }
  function bsonEncodeDoc(doc) {
    const bytes = [];
    for (const [key, value] of Object.entries(doc)) bsonEncodeValue(bytes, key, value);
    bytes.push(0x00);
    const total = bytes.length + 4;
    return new Uint8Array([total & 0xff, (total >> 8) & 0xff, (total >> 16) & 0xff, (total >> 24) & 0xff, ...bytes]);
  }

  function buildUGCDocument(pgcBytes, title, docType, privacy) {
    const data = pgcBytes instanceof Uint8Array ? pgcBytes : new Uint8Array(pgcBytes);
    return bsonEncodeDoc({
      Resources: [{ data, extension: '', resourceType: 'PgcV1' }],
      DefaultSnapshotType: null, ParticipantIds: null,
      PrivacyStatus: privacy, Title: title, Type: docType,
    });
  }

  async function calculateSignature(data) {
    const salt = enc.encode('58TRxs$p@Qzw9f');
    const key  = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig  = await crypto.subtle.sign('HMAC', key, data);
    return '3' + btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  function findResourceId(meta, resourceType) {
    return (meta.resources ?? []).find(r => r.type === resourceType)?.id ?? null;
  }

