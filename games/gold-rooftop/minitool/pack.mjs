// Zips the built mini-tool so index.html sits at the archive root (needs Node 22+ for zlib.crc32).
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateRawSync } from 'node:zlib';

const out = fileURLToPath(new URL('../../../dist/minitool/gold-rooftop/', import.meta.url));
for (const name of ['index.html', 'style.css']) copyFileSync(fileURLToPath(new URL(name, import.meta.url)), out + 'package/' + name);
const names = readdirSync(out + 'package', { recursive: true, withFileTypes: true })
  .filter(e => e.isFile())
  .map(e => relative(out + 'package', join(e.parentPath, e.name)).split(sep).join('/'))
  .sort();
if (!names.includes('index.html')) throw new Error('index.html is missing from the package');

const parts = [], central = [];
let offset = 0;
for (const name of names) {
  const raw = readFileSync(out + 'package/' + name), data = deflateRawSync(raw, { level: 9 });
  const file = Buffer.from(name, 'utf8'), head = Buffer.alloc(26);
  head.writeUInt16LE(20, 0); head.writeUInt16LE(0x0800, 2); head.writeUInt16LE(8, 4);
  head.writeUInt16LE(0, 6); head.writeUInt16LE(0x21, 8);
  head.writeUInt32LE(crc32(raw), 10); head.writeUInt32LE(data.length, 14); head.writeUInt32LE(raw.length, 18);
  head.writeUInt16LE(file.length, 22); head.writeUInt16LE(0, 24);
  const local = Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), head, file, data]);
  const entry = Buffer.alloc(14); entry.writeUInt32LE(offset, 10);
  central.push(Buffer.concat([Buffer.from([0x50, 0x4b, 1, 2, 20, 0]), head, entry, file]));
  parts.push(local); offset += local.length;
}
const dir = Buffer.concat(central), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(names.length, 8); end.writeUInt16LE(names.length, 10);
end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
writeFileSync(out + 'gold-rooftop-minitool.zip', Buffer.concat([...parts, dir, end]));
console.log(`gold-rooftop-minitool.zip: ${names.join(', ')}`);
