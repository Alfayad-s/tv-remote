#!/usr/bin/env node
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(root, "apps/web/public");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function png(size, paint) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x, y, size);
      const index = y * stride + 1 + x * 4;
      raw[index] = r;
      raw[index + 1] = g;
      raw[index + 2] = b;
      raw[index + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function dist(x, y, cx, cy) {
  return Math.hypot(x - cx, y - cy);
}

function paintIcon(x, y, size, maskable) {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const pad = maskable ? size * 0.18 : size * 0.08;
  const rx = size / 2 - pad;
  const ry = size / 2 - pad;
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  const inside = nx * nx + ny * ny <= 1.05;

  if (!inside) {
    return maskable ? [7, 16, 24, 255] : [0, 0, 0, 0];
  }

  const bg = [7, 16, 24, 255];
  const bodyW = size * 0.28;
  const bodyH = size * 0.36;
  const inBody = Math.abs(x - cx) < bodyW && Math.abs(y - cy) < bodyH;
  const dpad = dist(x, y, cx, cy - size * 0.06);
  const ring = Math.abs(dpad - size * 0.09);
  const bar = Math.abs(y - (cy + size * 0.16)) < size * 0.018 && Math.abs(x - cx) < size * 0.12;

  if (ring < size * 0.018) {
    return [45, 212, 191, 255];
  }
  if (dpad < size * 0.055) {
    return [94, 234, 212, 255];
  }
  if (bar) {
    return [148, 197, 255, 210];
  }
  if (inBody) {
    return [18, 32, 48, 255];
  }
  return bg;
}

async function writePng(relativePath, size, maskable = false) {
  const filePath = resolve(publicDir, relativePath);
  await mkdir(dirname(filePath), { recursive: true });
  await new Promise((resolveWrite, reject) => {
    const stream = createWriteStream(filePath);
    stream.on("finish", resolveWrite);
    stream.on("error", reject);
    stream.end(png(size, (x, y, s) => paintIcon(x, y, s, maskable)));
  });
}

await writePng("icons/icon-192.png", 192);
await writePng("icons/icon-512.png", 512);
await writePng("icons/icon-512-maskable.png", 512, true);
await writePng("apple-touch-icon.png", 180);
console.log("Wrote PWA icons to apps/web/public");
