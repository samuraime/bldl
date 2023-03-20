import { exec } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';
import curry from 'lodash/fp/curry.js';

const promisifiedExec = promisify(exec);

function escapeQuote(string) {
  return string.replace(/"/, '\\"');
}

async function mergeTracks(context, {metadata, tracks}) {
  const output = context.output ?? path.resolve(`${metadata.title}.mp4`);

  const inputs = tracks
    .map((track) => `-i "${escapeQuote(track.path)}"`)
    .join(' ');

  const ffmpegCommand = `ffmpeg ${inputs} -c:v copy -c:a copy "${escapeQuote(output)}" -y`;

  await promisifiedExec(ffmpegCommand).catch(() => {
    throw new Error('Fail to merge tracks');
  });

  if (!context.keepTmpTracks) {
    await Promise.all(
      tracks.map((track) => fs.unlink(track.path)),
    ).catch(() => {
      // Ignore the error
    });
  }
  
  return output;
}

export default curry(mergeTracks);
