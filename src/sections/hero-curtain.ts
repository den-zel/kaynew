type HeroCurtainOptions = {
  track: HTMLElement;
  canvas: HTMLCanvasElement;
};

export type HeroCurtain = {
  render: () => void;
  resize: () => void;
  dispose: () => void;
};

const EDGE_ZONE = 0.1;
const EDGE_POWER = 2.6;
const SEAM_START = 0.0002;
const SEAM_END = 0.0003;

const vertexSource = `
  attribute vec2 aUv;
  uniform vec2 uResolution;
  uniform vec4 uRect;
  uniform float uBandCenter;
  uniform vec2 uGates;
  varying vec2 vUv;
  varying float vEdge;

  void main() {
    vUv = aUv;
    vec2 screen = uRect.xy + vec2(aUv.x, 1.0 - aUv.y) * uRect.zw;
    float sx = screen.x / uResolution.x;
    float distanceToEdge = min(sx, 1.0 - sx);
    float edge = pow(1.0 - smoothstep(0.0, 0.1, distanceToEdge), 2.6);
    edge *= mix(uGates.x, uGates.y, step(0.5, sx));
    float blend = smoothstep(0.0002, 0.0003, edge);
    float y = uBandCenter + (screen.y - uBandCenter) * (1.0 + 0.6 * edge * blend);
    gl_Position = vec4(sx * 2.0 - 1.0, 1.0 - y / uResolution.y * 2.0, 0.0, 1.0);
    vEdge = edge;
  }
`;

const fragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uUvScale;
  uniform vec2 uUvOffset;
  uniform vec4 uMediaBounds;
  uniform vec4 uBackground;
  uniform vec2 uTileSize;
  uniform float uRadius;
  uniform float uMediaRadius;
  uniform float uFullTile;
  varying vec2 vUv;
  varying float vEdge;

  void main() {
    vec2 mediaUv = (vUv - uMediaBounds.xy) / uMediaBounds.zw;
    float inside = step(0.0, mediaUv.x) * step(mediaUv.x, 1.0)
      * step(0.0, mediaUv.y) * step(mediaUv.y, 1.0);
    if (uMediaRadius > 0.0) {
      vec2 mediaSize = uMediaBounds.zw * uTileSize;
      float radius = min(uMediaRadius, min(mediaSize.x, mediaSize.y) * 0.5);
      vec2 q = abs(mediaUv * mediaSize - mediaSize * 0.5) - mediaSize * 0.5 + radius;
      float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
      inside *= 1.0 - smoothstep(0.0, 1.5, d);
    }
    vec2 uv = uUvOffset + mediaUv * uUvScale;
    vec4 base = texture2D(uTexture, uv);
    float seam = smoothstep(0.0002, 0.0003, vEdge);
    float fx = smoothstep(0.0003, 0.012, vEdge);
    float chroma = 0.02 * fx * (0.4 + vEdge);
    float red = texture2D(uTexture, uv + vec2(0.0, chroma)).r;
    float blue = texture2D(uTexture, uv - vec2(0.0, chroma)).b;
    float mask = uFullTile > 0.5 ? 1.0 : seam;

    if (uRadius > 0.0) {
      vec2 q = abs(vUv * uTileSize - uTileSize * 0.5) - uTileSize * 0.5 + uRadius;
      float d = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - uRadius;
      mask *= 1.0 - smoothstep(0.0, 1.5, d);
    }

    vec3 rgb = mix(base.rgb, vec3(red, base.g, blue), fx);
    vec4 media = vec4(rgb * base.a, base.a) * inside;
    vec4 background = vec4(uBackground.rgb * uBackground.a, uBackground.a);
    gl_FragColor = (media + background * (1.0 - media.a)) * mask;
  }
`;

function smoothstep(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

// Hand the DOM over where the GL seam is effectively opaque, avoiding a white
// join between the flat photograph and its curved edge.
const DOM_CLIP_EDGE = (() => {
  let low = 0;
  let high = EDGE_ZONE;

  for (let i = 0; i < 24; i++) {
    const distance = (low + high) / 2;
    const edge = Math.pow(1 - smoothstep(0, EDGE_ZONE, distance), EDGE_POWER);
    if (smoothstep(SEAM_START, SEAM_END, edge) >= 0.99) low = distance;
    else high = distance;
  }

  return low;
})();

type MediaTile = {
  element: HTMLElement;
  media: HTMLImageElement | HTMLVideoElement;
  video: boolean;
  texture: WebGLTexture | null;
  source: string;
  failedSource: string | null;
  videoTime: number;
  width: number;
  height: number;
  positionX: number;
  positionY: number;
  objectFit: string;
  background: [number, number, number, number];
  radius: number;
  mediaRadius: number;
  clipPath: string;
  opacity: string;
};

type TextTile = {
  element: HTMLElement;
  texture: WebGLTexture | null;
  opacity: string;
};

type TextLine = { text: string; left: number; top: number; height: number };

function textLines(node: Text) {
  const text = node.textContent ?? "";
  const range = document.createRange();
  const lines: TextLine[] = [];
  let start = 0;
  let previousTop: number | null = null;

  function addLine(end: number) {
    let first = start;
    while (first < end && /\s/.test(text[first])) first++;
    while (end > first && /\s/.test(text[end - 1])) end--;
    if (first === end) return;
    range.setStart(node, first);
    range.setEnd(node, end);
    const rect = range.getBoundingClientRect();
    lines.push({ text: text.slice(first, end), left: rect.left, top: rect.top, height: rect.height });
  }

  // The browser has already resolved text-wrap: balance and the actual font.
  // Measure its line breaks instead of approximating wrapping in the canvas.
  for (let index = 0; index < text.length; index++) {
    range.setStart(node, index);
    range.setEnd(node, index + 1);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (previousTop !== null && Math.abs(rect.top - previousTop) > 1) {
      addLine(index);
      start = index;
    }
    previousTop = rect.top;
  }
  addLine(text.length);
  return lines;
}

function snapshotText(element: HTMLElement, dpr: number) {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const snapshot = document.createElement("canvas");
  snapshot.width = Math.max(1, Math.round(rect.width * dpr));
  snapshot.height = Math.max(1, Math.round(rect.height * dpr));
  const drawing = snapshot.getContext("2d");
  if (!drawing) return null;
  drawing.scale(dpr, dpr);
  drawing.textBaseline = "alphabetic";

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let current = walker.nextNode(); current; current = walker.nextNode()) {
    if (!current.textContent?.trim() || !current.parentElement) continue;
    const style = getComputedStyle(current.parentElement);
    drawing.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    drawing.fillStyle = style.color;
    drawing.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
    const metrics = drawing.measureText("Hg");
    const fontSize = parseFloat(style.fontSize) || 13;
    const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || fontSize * 0.8;
    const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || fontSize * 0.2;

    for (const line of textLines(current as Text)) {
      const baseline = line.top + (line.height - ascent - descent) / 2 + ascent;
      drawing.fillText(line.text, line.left - rect.left, baseline - rect.top);
    }
  }

  return snapshot;
}

function objectPosition(value: string | undefined) {
  if (value?.endsWith("%")) return parseFloat(value) / 100;
  if (value === "left" || value === "top") return 0;
  if (value === "right" || value === "bottom") return 1;
  return 0.5;
}

/** The centre stays in the DOM; a small WebGL mesh bends only the rail's edges. */
export function createHeroCurtain({
  track,
  canvas,
}: HeroCurtainOptions): HeroCurtain | null {
  let gl: WebGLRenderingContext | null;

  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      depth: false,
      stencil: false,
    });
  } catch {
    return null;
  }

  if (!gl || gl.isContextLost()) return null;
  const context = gl;

  function compile(type: number, source: string) {
    const shader = context.createShader(type);
    if (!shader) return null;
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
      context.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertex = compile(context.VERTEX_SHADER, vertexSource);
  const fragment = compile(context.FRAGMENT_SHADER, fragmentSource);
  const program = context.createProgram();

  if (!vertex || !fragment || !program) {
    if (vertex) context.deleteShader(vertex);
    if (fragment) context.deleteShader(fragment);
    if (program) context.deleteProgram(program);
    return null;
  }

  context.attachShader(program, vertex);
  context.attachShader(program, fragment);
  context.linkProgram(program);
  context.deleteShader(vertex);
  context.deleteShader(fragment);

  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    context.deleteProgram(program);
    return null;
  }

  const columns = 48;
  const rows = 14;
  const uvs = new Float32Array((columns + 1) * (rows + 1) * 2);
  const indices = new Uint16Array(columns * rows * 6);
  let vertexOffset = 0;
  let indexOffset = 0;

  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      uvs[vertexOffset++] = column / columns;
      uvs[vertexOffset++] = row / rows;
      if (row === rows || column === columns) continue;
      const a = row * (columns + 1) + column;
      const b = a + columns + 1;
      indices[indexOffset++] = a;
      indices[indexOffset++] = b;
      indices[indexOffset++] = a + 1;
      indices[indexOffset++] = a + 1;
      indices[indexOffset++] = b;
      indices[indexOffset++] = b + 1;
    }
  }

  const vertexBuffer = context.createBuffer();
  const indexBuffer = context.createBuffer();

  if (!vertexBuffer || !indexBuffer) {
    if (vertexBuffer) context.deleteBuffer(vertexBuffer);
    if (indexBuffer) context.deleteBuffer(indexBuffer);
    context.deleteProgram(program);
    return null;
  }

  context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
  context.bufferData(context.ARRAY_BUFFER, uvs, context.STATIC_DRAW);
  context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indexBuffer);
  context.bufferData(context.ELEMENT_ARRAY_BUFFER, indices, context.STATIC_DRAW);

  const attribute = context.getAttribLocation(program, "aUv");
  const uniform = {
    resolution: context.getUniformLocation(program, "uResolution"),
    rect: context.getUniformLocation(program, "uRect"),
    bandCenter: context.getUniformLocation(program, "uBandCenter"),
    gates: context.getUniformLocation(program, "uGates"),
    texture: context.getUniformLocation(program, "uTexture"),
    uvScale: context.getUniformLocation(program, "uUvScale"),
    uvOffset: context.getUniformLocation(program, "uUvOffset"),
    mediaBounds: context.getUniformLocation(program, "uMediaBounds"),
    background: context.getUniformLocation(program, "uBackground"),
    tileSize: context.getUniformLocation(program, "uTileSize"),
    radius: context.getUniformLocation(program, "uRadius"),
    mediaRadius: context.getUniformLocation(program, "uMediaRadius"),
    fullTile: context.getUniformLocation(program, "uFullTile"),
  };

  const tiles: MediaTile[] = [];

  for (const element of track.querySelectorAll<HTMLElement>("[data-hero-media]")) {
    const media = element.querySelector<HTMLImageElement | HTMLVideoElement>("img, video");
    if (!media) continue;
    tiles.push({
      element,
      media,
      video: media.tagName === "VIDEO",
      texture: null,
      source: "",
      failedSource: null,
      videoTime: -1,
      width: 0,
      height: 0,
      positionX: 0.5,
      positionY: 0.5,
      objectFit: "cover",
      background: [0, 0, 0, 0],
      radius: 0,
      mediaRadius: 0,
      clipPath: element.style.clipPath,
      opacity: media.style.opacity,
    });
  }

  const textTiles: TextTile[] = Array.from(
    track.querySelectorAll<HTMLElement>("[data-hero-text]"),
    (element) => ({ element, texture: null, opacity: element.style.opacity }),
  );

  let width = 1;
  let height = 1;
  let dpr = 1;
  let unavailable = false;
  let disposed = false;
  let fontsReady = false;
  let snapshotTimer = 0;
  const initialCanvasVisibility = canvas.style.visibility;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = colorCanvas.height = 1;
  const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
  const colors = new Map<string, [number, number, number, number]>();

  function backgroundColor(color: string): [number, number, number, number] {
    const cached = colors.get(color);
    if (cached) return cached;
    if (!colorContext) return [0, 0, 0, 0];
    // Canvas resolves modern CSS colors (including theme-token oklch) to sRGB.
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = color;
    colorContext.fillRect(0, 0, 1, 1);
    const pixel = colorContext.getImageData(0, 0, 1, 1).data;
    const rgba: [number, number, number, number] = [pixel[0] / 255, pixel[1] / 255, pixel[2] / 255, pixel[3] / 255];
    colors.set(color, rgba);
    return rgba;
  }

  function restore(tile: MediaTile) {
    if (tile.element.style.clipPath !== tile.clipPath) {
      tile.element.style.clipPath = tile.clipPath;
    }
    if (tile.media.style.opacity !== tile.opacity) {
      tile.media.style.opacity = tile.opacity;
    }
  }

  function restoreText(tile: TextTile) {
    if (tile.element.style.opacity !== tile.opacity) {
      tile.element.style.opacity = tile.opacity;
    }
  }

  function rasterizeText() {
    if (disposed || unavailable || !fontsReady) return;
    context.activeTexture(context.TEXTURE0);

    for (const tile of textTiles) {
      const snapshot = snapshotText(tile.element, dpr);
      if (!snapshot) continue;
      tile.texture ??= context.createTexture();
      if (!tile.texture) continue;
      context.bindTexture(context.TEXTURE_2D, tile.texture);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
      context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
      context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
      context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, snapshot);
    }
  }

  function scheduleTextSnapshots(delay: number) {
    window.clearTimeout(snapshotTimer);
    snapshotTimer = window.setTimeout(rasterizeText, delay);
  }

  void document.fonts.ready.then(() => {
    if (disposed || unavailable) return;
    fontsReady = true;
    scheduleTextSnapshots(0);
  });

  function contextLost() {
    unavailable = true;
    canvas.style.visibility = "hidden";
    tiles.forEach(restore);
    textTiles.forEach(restoreText);
    window.clearTimeout(snapshotTimer);
  }

  canvas.addEventListener("webglcontextlost", contextLost);

  function resize() {
    if (disposed || unavailable) return;
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.viewport(0, 0, canvas.width, canvas.height);

    for (const tile of tiles) {
      const mediaStyle = getComputedStyle(tile.media);
      const tileStyle = getComputedStyle(tile.element);
      const position = mediaStyle.objectPosition.split(/\s+/);
      tile.positionX = objectPosition(position[0]);
      tile.positionY = objectPosition(position[1]);
      tile.objectFit = mediaStyle.objectFit;
      tile.background = backgroundColor(tileStyle.backgroundColor);
      tile.radius = parseFloat(tileStyle.borderTopLeftRadius) || 0;
      tile.mediaRadius = parseFloat(mediaStyle.borderTopLeftRadius) || 0;
    }

    for (const tile of textTiles) {
      restoreText(tile);
      if (tile.texture) context.deleteTexture(tile.texture);
      tile.texture = null;
    }
    scheduleTextSnapshots(150);
  }

  function upload(tile: MediaTile) {
    const media = tile.media;
    const source = media.currentSrc || media.src;
    if (!source || tile.failedSource === source) return false;

    if (tile.video) {
      const video = media as HTMLVideoElement;
      if (video.readyState < 2 || video.videoWidth === 0) return false;
      tile.width = video.videoWidth;
      tile.height = video.videoHeight;
      if (tile.texture && tile.source === source && tile.videoTime === video.currentTime) {
        return true;
      }
      tile.videoTime = video.currentTime;
    } else {
      const image = media as HTMLImageElement;
      if (!image.complete || image.naturalWidth === 0) return false;
      tile.width = image.naturalWidth;
      tile.height = image.naturalHeight;
      if (tile.texture && tile.source === source) return true;
    }

    tile.texture ??= context.createTexture();
    if (!tile.texture) return false;

    context.bindTexture(context.TEXTURE_2D, tile.texture);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);
    context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    try {
      context.texImage2D(
        context.TEXTURE_2D,
        0,
        context.RGBA,
        context.RGBA,
        context.UNSIGNED_BYTE,
        media,
      );
      tile.source = source;
      return true;
    } catch {
      // A failed/CORS-restricted image must remain visible in the DOM.
      tile.failedSource = source;
      context.deleteTexture(tile.texture);
      tile.texture = null;
      return false;
    }
  }

  function render() {
    if (disposed || unavailable) return;
    if (context.isContextLost()) {
      contextLost();
      return;
    }

    context.clearColor(0, 0, 0, 0);
    context.clear(context.COLOR_BUFFER_BIT);
    if (document.hidden) {
      tiles.forEach(restore);
      textTiles.forEach(restoreText);
      return;
    }

    context.useProgram(program);
    context.enable(context.BLEND);
    context.blendFunc(context.ONE, context.ONE_MINUS_SRC_ALPHA);
    context.disable(context.DEPTH_TEST);
    context.disable(context.CULL_FACE);
    context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
    context.enableVertexAttribArray(attribute);
    context.vertexAttribPointer(attribute, 2, context.FLOAT, false, 0, 0);
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, indexBuffer);
    context.activeTexture(context.TEXTURE0);
    context.uniform1i(uniform.texture, 0);
    context.uniform2f(uniform.resolution, width, height);

    const trackRect = track.getBoundingClientRect();
    const edgeWidth = EDGE_ZONE * width;
    const leftGate = smoothstep(0, 1, -trackRect.left / edgeWidth);
    const rightGate = smoothstep(0, 1, (trackRect.left + track.scrollWidth - width) / edgeWidth);
    context.uniform2f(uniform.gates, leftGate, rightGate);
    context.uniform1f(uniform.bandCenter, trackRect.top + trackRect.height / 2);

    for (const tile of tiles) {
      const rect = tile.element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < width
        && rect.bottom > 0 && rect.top < height;
      const leftEdge = rect.left < edgeWidth && leftGate > 0.001;
      const rightEdge = rect.right > width - edgeWidth && rightGate > 0.001;

      if (!visible || (!tile.video && !leftEdge && !rightEdge) || !upload(tile)) {
        restore(tile);
        continue;
      }

      const snap = (value: number) => Math.round(value * dpr) / dpr;
      const mediaRect = tile.media.getBoundingClientRect();
      if (mediaRect.width <= 0 || mediaRect.height <= 0) {
        restore(tile);
        continue;
      }
      const aspect = mediaRect.width / mediaRect.height;
      const sourceAspect = tile.width / tile.height;
      let contentWidth = mediaRect.width;
      let contentHeight = mediaRect.height;
      let scaleX = 1;
      let scaleY = 1;

      if (tile.objectFit === "contain" || tile.objectFit === "scale-down") {
        const fit = Math.min(mediaRect.width / tile.width, mediaRect.height / tile.height);
        const scale = tile.objectFit === "scale-down" ? Math.min(1, fit) : fit;
        contentWidth = tile.width * scale;
        contentHeight = tile.height * scale;
      } else if (tile.objectFit === "none") {
        contentWidth = tile.width;
        contentHeight = tile.height;
      } else if (tile.objectFit === "cover") {
        scaleX = sourceAspect > aspect ? aspect / sourceAspect : 1;
        scaleY = sourceAspect > aspect ? 1 : sourceAspect / aspect;
      }

      const contentLeft = mediaRect.left + (mediaRect.width - contentWidth) * tile.positionX;
      const contentTop = mediaRect.top + (mediaRect.height - contentHeight) * tile.positionY;

      context.uniform4f(uniform.rect, snap(rect.left), snap(rect.top), snap(rect.width), snap(rect.height));
      context.uniform2f(uniform.uvScale, scaleX, scaleY);
      context.uniform2f(uniform.uvOffset, (1 - scaleX) * tile.positionX, (1 - scaleY) * (1 - tile.positionY));
      context.uniform4f(
        uniform.mediaBounds,
        (contentLeft - rect.left) / rect.width,
        (rect.bottom - contentTop - contentHeight) / rect.height,
        contentWidth / rect.width,
        contentHeight / rect.height,
      );
      context.uniform4f(uniform.background, ...tile.background);
      context.uniform2f(uniform.tileSize, rect.width, rect.height);
      context.uniform1f(uniform.radius, tile.video ? tile.radius : 0);
      context.uniform1f(uniform.mediaRadius, tile.mediaRadius);
      context.uniform1f(uniform.fullTile, tile.video ? 1 : 0);
      context.bindTexture(context.TEXTURE_2D, tile.texture);
      context.drawElements(context.TRIANGLES, indices.length, context.UNSIGNED_SHORT, 0);

      // Only hand pixels to WebGL after their texture has uploaded successfully.
      if (tile.video) {
        tile.media.style.opacity = "0";
      } else {
        const clipLeft = leftEdge ? Math.max(0, (DOM_CLIP_EDGE * width - rect.left) * leftGate) : 0;
        const clipRight = rightEdge ? Math.max(0, (rect.right - (width - DOM_CLIP_EDGE * width)) * rightGate) : 0;
        const clipPath = `inset(0 ${clipRight}px 0 ${clipLeft}px)`;
        if (tile.element.style.clipPath !== clipPath) tile.element.style.clipPath = clipPath;
      }
    }

    for (const tile of textTiles) {
      const rect = tile.element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < width
        && rect.bottom > 0 && rect.top < height;
      const atEdge = (rect.left < edgeWidth && leftGate > 0.001)
        || (rect.right > width - edgeWidth && rightGate > 0.001);

      if (!tile.texture || !visible || !atEdge) {
        restoreText(tile);
        continue;
      }

      const snap = (value: number) => Math.round(value * dpr) / dpr;
      context.uniform4f(uniform.rect, snap(rect.left), snap(rect.top), snap(rect.width), snap(rect.height));
      context.uniform2f(uniform.uvScale, 1, 1);
      context.uniform2f(uniform.uvOffset, 0, 0);
      context.uniform4f(uniform.mediaBounds, 0, 0, 1, 1);
      context.uniform4f(uniform.background, 0, 0, 0, 0);
      context.uniform2f(uniform.tileSize, rect.width, rect.height);
      context.uniform1f(uniform.radius, 0);
      context.uniform1f(uniform.mediaRadius, 0);
      context.uniform1f(uniform.fullTile, 1);
      context.bindTexture(context.TEXTURE_2D, tile.texture);
      context.drawElements(context.TRIANGLES, indices.length, context.UNSIGNED_SHORT, 0);
      tile.element.style.opacity = "0";
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    window.clearTimeout(snapshotTimer);
    canvas.removeEventListener("webglcontextlost", contextLost);
    tiles.forEach((tile) => {
      restore(tile);
      if (tile.texture) context.deleteTexture(tile.texture);
    });
    textTiles.forEach((tile) => {
      restoreText(tile);
      if (tile.texture) context.deleteTexture(tile.texture);
    });
    context.deleteBuffer(vertexBuffer);
    context.deleteBuffer(indexBuffer);
    context.deleteProgram(program);
    if (!context.isContextLost()) context.clear(context.COLOR_BUFFER_BIT);
    canvas.style.visibility = initialCanvasVisibility;
  }

  resize();
  return { render, resize, dispose };
}
