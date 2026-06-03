  // ─── PNG codec ────────────────────────────────────────────────────────────

  function parsePngChunks(bytes) {
    const view = new DataView(bytes.buffer ?? bytes);
    for (let i = 0; i < 8; i++) {
      if (bytes[i] !== PNG_SIG[i]) return [];
    }
    const chunks = [];
    let offset   = 8;
    const td     = new TextDecoder();
    while (offset + 12 <= bytes.length) {
      const length    = view.getUint32(offset);
      const typeBytes = bytes.slice(offset + 4, offset + 8);
      const type      = td.decode(typeBytes);
      const dataEnd   = offset + 8 + length;
      if (dataEnd + 4 > bytes.length) break;
      chunks.push({ type, typeBytes, data: bytes.slice(offset + 8, dataEnd), crc: bytes.slice(dataEnd, dataEnd + 4) });
      offset = dataEnd + 4;
      if (type === 'IEND') break;
    }
    return chunks;
  }

  function crc32(buf) {
    if (!crc32._table) {
      crc32._table = new Int32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        crc32._table[i] = c;
      }
    }
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = crc32._table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  }

  function buildChunk(type, data) {
    const te        = new TextEncoder();
    const typeBytes = te.encode(type);
    const combined  = new Uint8Array(typeBytes.length + data.length);
    combined.set(typeBytes);
    combined.set(data, typeBytes.length);
    const crcVal  = crc32(combined);
    const out     = new Uint8Array(4 + 4 + data.length + 4);
    const view    = new DataView(out.buffer);
    view.setUint32(0, data.length);
    out.set(typeBytes, 4);
    out.set(data, 8);
    view.setUint32(8 + data.length, crcVal);
    return out;
  }

  function buildPng(chunkList) {
    const parts  = [PNG_SIG, ...chunkList.map(([t, d]) => buildChunk(t, d))];
    const total  = parts.reduce((acc, p) => acc + p.length, 0);
    const output = new Uint8Array(total);
    let offset   = 0;
    for (const p of parts) { output.set(p, offset); offset += p.length; }
    return output;
  }

  function stripPngMetadata(bytes) {
    const chunks = parsePngChunks(bytes);
    if (!chunks.length) return bytes;
    const kept = chunks.filter(c => PNG_CRITICAL.has(c.type)).map(c => [c.type, c.data]);
    return buildPng(kept);
  }

  function applyMspMetadata(targetBytes, templateChunks) {
    if (!templateChunks?.length) return targetBytes;
    const targetChunks = parsePngChunks(targetBytes);
    if (!targetChunks.length) return targetBytes;
    const targetIhdr = targetChunks.find(c => c.type === 'IHDR');
    if (!targetIhdr) return targetBytes;
    const templateMeta = templateChunks.filter(c => !PNG_SKIP_FROM_TEMPLATE.has(c.type));
    const result = [];
    result.push(['IHDR', targetIhdr.data]);
    for (const c of templateMeta) result.push([c.type, c.data]);
    for (const c of targetChunks) {
      if (c.type === 'PLTE' || c.type === 'tRNS' || c.type === 'IDAT') result.push([c.type, c.data]);
    }
    result.push(['IEND', new Uint8Array(0)]);
    return buildPng(result);
  }

  async function canvasEncodePng(canvas) {
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
      }, 'image/png');
    });
  }

  async function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });
  }

  function drawToCanvas(img, w, h) {
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas;
  }

  function blurDownscaleCanvas(img, origW, origH, factor) {
    const sw = Math.max(1, Math.round(origW * factor));
    const sh = Math.max(1, Math.round(origH * factor));
    const small = document.createElement('canvas');
    small.width = sw; small.height = sh;
    small.getContext('2d').drawImage(img, 0, 0, sw, sh);
    const big = document.createElement('canvas');
    big.width = origW; big.height = origH;
    big.getContext('2d').drawImage(small, 0, 0, origW, origH);
    return big;
  }

  function reduceColorsCanvas(srcCanvas, levels) {
    const { width, height } = srcCanvas;
    const ctx  = srcCanvas.getContext('2d');
    const id   = ctx.getImageData(0, 0, width, height);
    const d    = id.data;
    const step = 255 / (levels - 1);
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = Math.round(Math.round(d[i]     / step) * step);
      d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
      d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
    }
    const out = document.createElement('canvas');
    out.width = width; out.height = height;
    out.getContext('2d').putImageData(id, 0, 0);
    return out;
  }

  async function processImageFile(file) {
    const img    = await loadImageFromFile(file);
    const W      = AVATAR_SIZE, H = AVATAR_SIZE;
    const base   = drawToCanvas(img, W, H);
    let png = stripPngMetadata(await canvasEncodePng(base));
    if (png.length <= MAX_PNG_BYTES) return png;
    for (const levels of [8, 6, 5, 4, 3, 2]) {
      const reduced = reduceColorsCanvas(base, levels);
      png = stripPngMetadata(await canvasEncodePng(reduced));
      if (png.length <= MAX_PNG_BYTES) return png;
    }
    for (const factor of [0.75, 0.5, 0.375, 0.25]) {
      const blurred = blurDownscaleCanvas(img, W, H, factor);
      png = stripPngMetadata(await canvasEncodePng(blurred));
      if (png.length <= MAX_PNG_BYTES) return png;
    }
    for (const factor of [0.5, 0.375, 0.25]) {
      for (const levels of [4, 3, 2]) {
        const blurred = blurDownscaleCanvas(img, W, H, factor);
        const reduced = reduceColorsCanvas(blurred, levels);
        png = stripPngMetadata(await canvasEncodePng(reduced));
        if (png.length <= MAX_PNG_BYTES) return png;
      }
    }
    return png;
  }

