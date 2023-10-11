import Path from 'path';
import * as fs from 'fs';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
export default function getVersion(): string {
  const parentFile = Path.join(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    'package.json',
  );
  const file = Path.join(__dirname, '..', '..', 'package.json');

  let pck;
  if (fs.existsSync(parentFile)) {
    pck = fs.readFileSync(parentFile, {
      encoding: 'utf8',
    });
  } else {
    pck = fs.readFileSync(file, {
      encoding: 'utf8',
    });
  }

  const json = JSON.parse(pck);
  return json.version || '0.0.0';
}
