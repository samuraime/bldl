import { exec } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import curry from 'lodash/fp/curry.js';

const promisifiedExec = promisify(exec);

function escapeQuote(string) {
  return string.replace(/"/, '\\"');
}

async function getOutputPath(output, defaultFileName) {
  if (!output) {
    return path.resolve(defaultFileName);
  }

  try {
    const stats = await fs.stat(output);

    if (stats.isDirectory()) {
      return path.resolve(output, defaultFileName);
    }

    return path.resolve(output); // Overwrite
  } catch {
    return path.resolve(output);
  }
}

async function mergeTracks(context, {metadata, tracks}) {
  const output = await getOutputPath(context.output, `${metadata.title}.mp4`);

  const inputs = tracks
    .map((track) => `-i "${escapeQuote(track.path)}"`)
    .join(' ');

  const ffmpegCommand = `ffmpeg ${inputs} -c:v copy -c:a copy "${escapeQuote(output)}" -y`;

  await promisifiedExec(ffmpegCommand).catch((error) => {
    context.keepTmpTracks = true; // Keep tmp tracks in case we'd like to merge them manually
    
    throw new Error('Fail to merge tracks: \n' + error.message);
  });
  
  return output;
}

export default curry(mergeTracks);
