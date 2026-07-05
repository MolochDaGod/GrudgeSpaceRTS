import * as THREE from "three";

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v =
        (Math.sin(x * scale) + Math.cos(y * scale * 1.3) + Math.sin((x + y) * scale * 0.7)) / 3;
      const n = Math.floor(128 + v * 40);
      const i = (y * w + x) * 4;
      img.data[i] = n;
      img.data[i + 1] = n;
      img.data[i + 2] = n;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function makeTex(base: string, noiseAmt: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  noise(ctx, size, size, noiseAmt);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

let cache: {
  sand: THREE.CanvasTexture;
  grass: THREE.CanvasTexture;
  rock: THREE.CanvasTexture;
  snow: THREE.CanvasTexture;
} | null = null;

export function getTerrainTextures() {
  if (!cache) {
    cache = {
      sand: makeTex("#c9b88a", 0.18),
      grass: makeTex("#4a6b3a", 0.12),
      rock: makeTex("#6a6458", 0.22),
      snow: makeTex("#e8eef2", 0.08),
    };
  }
  return cache;
}