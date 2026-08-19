import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pngToIco from 'png-to-ico';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'assets', 'branding');
const pngPath = path.join(outputDirectory, 'orbit-app-icon.png');
const icoPath = path.join(outputDirectory, 'orbit-app-icon.ico');
const size = 1024;
const image = new PNG({ width: size, height: size, colorType: 6 });

const palette = {
  navy: [2, 9, 18],
  steel: [45, 72, 91],
  cyan: [68, 229, 255],
  white: [225, 246, 250],
  shadow: [6, 20, 32],
  red: [255, 74, 91]
};
const clamp = value => Math.max(0, Math.min(1, value));

function blendPixel(x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= size || y >= size || alpha <= 0) return;
  const offset = (Math.floor(y) * size + Math.floor(x)) * 4;
  const a = clamp(alpha);
  image.data[offset] = Math.round(image.data[offset] * (1 - a) + color[0] * a);
  image.data[offset + 1] = Math.round(image.data[offset + 1] * (1 - a) + color[1] * a);
  image.data[offset + 2] = Math.round(image.data[offset + 2] * (1 - a) + color[2] * a);
  image.data[offset + 3] = 255;
}

function drawDisc(cx, cy, radius, color, alpha = 1) {
  const left = Math.max(0, Math.floor(cx - radius - 1));
  const right = Math.min(size - 1, Math.ceil(cx + radius + 1));
  const top = Math.max(0, Math.floor(cy - radius - 1));
  const bottom = Math.min(size - 1, Math.ceil(cy + radius + 1));
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const distance = Math.hypot(x + .5 - cx, y + .5 - cy);
      blendPixel(x, y, color, alpha * clamp(radius + .75 - distance));
    }
  }
}

function ringSegmentVisible(angle) {
  const normalized = (angle + Math.PI * 2) % (Math.PI * 2);
  return !(
    (normalized > .35 && normalized < .68) ||
    (normalized > 1.78 && normalized < 2.10) ||
    (normalized > 3.50 && normalized < 3.82) ||
    (normalized > 5.02 && normalized < 5.34)
  );
}

function drawRing(radius, width, color, alpha) {
  const cx = size / 2;
  const cy = size / 2;
  const bound = radius + width + 2;
  for (let y = Math.floor(cy - bound); y <= Math.ceil(cy + bound); y++) {
    for (let x = Math.floor(cx - bound); x <= Math.ceil(cx + bound); x++) {
      const dx = x + .5 - cx;
      const dy = y + .5 - cy;
      if (!ringSegmentVisible(Math.atan2(dy, dx))) continue;
      const edge = Math.abs(Math.hypot(dx, dy) - radius);
      blendPixel(x, y, color, alpha * clamp(width / 2 + .75 - edge));
    }
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function fillPolygon(points, color, alpha = 1) {
  const xs = points.map(point => point[0]);
  const ys = points.map(point => point[1]);
  const left = Math.max(0, Math.floor(Math.min(...xs)));
  const right = Math.min(size - 1, Math.ceil(Math.max(...xs)));
  const top = Math.max(0, Math.floor(Math.min(...ys)));
  const bottom = Math.min(size - 1, Math.ceil(Math.max(...ys)));
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const coverage = [
        pointInPolygon(x + .25, y + .25, points),
        pointInPolygon(x + .75, y + .25, points),
        pointInPolygon(x + .25, y + .75, points),
        pointInPolygon(x + .75, y + .75, points)
      ].filter(Boolean).length / 4;
      blendPixel(x, y, color, alpha * coverage);
    }
  }
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared ? clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function drawLine(ax, ay, bx, by, width, color, alpha = 1) {
  const radius = width / 2;
  const left = Math.max(0, Math.floor(Math.min(ax, bx) - radius - 1));
  const right = Math.min(size - 1, Math.ceil(Math.max(ax, bx) + radius + 1));
  const top = Math.max(0, Math.floor(Math.min(ay, by) - radius - 1));
  const bottom = Math.min(size - 1, Math.ceil(Math.max(ay, by) + radius + 1));
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const distance = distanceToSegment(x + .5, y + .5, ax, ay, bx, by);
      blendPixel(x, y, color, alpha * clamp(radius + .75 - distance));
    }
  }
}

// Deep navy background with a restrained cyan center light.
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const radial = clamp(1 - Math.hypot(x - size / 2, y - size * .48) / (size * .72));
    const vignette = clamp(1 - Math.hypot(x - size / 2, y - size / 2) / (size * .68));
    const offset = (y * size + x) * 4;
    image.data[offset] = Math.round(palette.navy[0] + radial * 3);
    image.data[offset + 1] = Math.round(palette.navy[1] + radial * 14 + vignette * 3);
    image.data[offset + 2] = Math.round(palette.navy[2] + radial * 23 + vignette * 5);
    image.data[offset + 3] = 255;
  }
}

let seed = 0x04c0ffee;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 0xffffffff;
};
for (let i = 0; i < 70; i++) {
  const x = 80 + random() * (size - 160);
  const y = 70 + random() * (size - 140);
  const radius = .7 + random() * 1.6;
  drawDisc(x, y, radius * 3.5, palette.cyan, .045);
  drawDisc(x, y, radius, palette.white, .35 + random() * .45);
}

// Segmented orbital instrument ring.
drawRing(348, 48, palette.cyan, .055);
drawRing(348, 24, palette.steel, .95);
drawRing(348, 8, palette.cyan, .95);
drawRing(314, 3, palette.steel, .7);

// Engine trail placed behind the hull.
for (let width = 88; width >= 12; width -= 8) {
  drawLine(512, 680, 512, 910, width, palette.cyan, .018 + (88 - width) * .0018);
}
drawLine(512, 680, 512, 910, 10, palette.white, .85);

const ship = [[512,150],[560,330],[610,462],[802,680],[620,642],[570,800],[512,724],[454,800],[404,642],[222,680],[414,462],[464,330]];
const shipInner = [[512,245],[548,400],[570,535],[650,650],[566,620],[540,690],[512,656],[484,690],[458,620],[374,650],[454,535],[476,400]];
const cockpit = [[512,300],[542,438],[530,560],[512,612],[494,560],[482,438]];

for (const width of [46, 32, 20]) {
  const alpha = width === 46 ? .035 : width === 32 ? .055 : .09;
  for (let i = 0; i < ship.length; i++) {
    const a = ship[i];
    const b = ship[(i + 1) % ship.length];
    drawLine(a[0], a[1], b[0], b[1], width, palette.cyan, alpha);
  }
}
fillPolygon(ship, palette.white, 1);
fillPolygon(shipInner, palette.shadow, .98);
fillPolygon(cockpit, [4, 35, 55], 1);

for (let i = 0; i < cockpit.length; i++) {
  const a = cockpit[i];
  const b = cockpit[(i + 1) % cockpit.length];
  drawLine(a[0], a[1], b[0], b[1], 12, palette.cyan, .95);
}
drawLine(292, 648, 424, 602, 13, palette.red, .95);
drawLine(732, 648, 600, 602, 13, palette.red, .95);
drawLine(512, 178, 512, 258, 8, palette.cyan, .95);
drawDisc(512, 150, 9, palette.white, .9);
drawDisc(512, 150, 34, palette.cyan, .08);

await mkdir(outputDirectory, { recursive: true });
const png = PNG.sync.write(image, { colorType: 6, inputColorType: 6 });
await writeFile(pngPath, png);
const ico = await pngToIco(pngPath);
assert.equal(ico.subarray(0, 4).toString('hex'), '00000100', 'generated Windows icon is invalid');
await writeFile(icoPath, ico);

console.log(`ORBIT branding: PASS (deterministic geometric mark, ${(png.length / 1024).toFixed(0)} KiB PNG, ${(ico.length / 1024).toFixed(0)} KiB ICO)`);
