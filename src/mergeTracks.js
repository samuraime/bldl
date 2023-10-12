import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import curry from 'lodash/fp/curry.js';

const promisifiedExec = promisify(exec);

function escapeSpecialCharacter(string) {
  const specialCharMap = {
    darwin: /[:/]/g,
    win32: /[:\\/?*"<>|]/g,
    linux: /[/]/g,
  };
  const specialChar = specialCharMap[os.platform()] || specialCharMap.win32;

  return string.replace(specialChar, '-');
}

function doubleQuote(string) {
  return `"${string.replace(/"/g, '\\"')}"`;
}

async function getOutputPath(output, defaultFileName) {
  const escapedDefaultFileName = escapeSpecialCharacter(defaultFileName);

  if (!output) {
    return path.resolve(escapedDefaultFileName);
  }

  try {
    const stats = await fs.stat(output);

    if (stats.isDirectory()) {
      return path.resolve(output, escapedDefaultFileName);
    }

    return path.resolve(output); // Overwrite
  } catch {
    return path.resolve(output);
  }
}

async function mergeTracks(context, { metadata, tracks }) {
  const output = await getOutputPath(
    context.output,
    `${metadata.title}.mp4`
  ).then(doubleQuote);

  const inputs = tracks
    .map((track) => track.path)
    .map(doubleQuote)
    .map((input) => `-i ${input}`)
    .join(' ');

  // `-tag:v hvc1` for Apple HEVC compatibility https://trac.ffmpeg.org/wiki/Encode/H.265#FinalCutandApplestuffcompatibility
  const outputs = tracks.some(({ codec }) => codec.includes('hev1'))
    ? `-c:v copy -tag:v hvc1 -c:a copy ${output}`
    : `-c copy ${output}`;

  const ffmpegCommand = `ffmpeg ${inputs} ${outputs} -y`;

  await promisifiedExec(ffmpegCommand).catch((error) => {
    context.keepTmpTracks = true; // Keep tmp tracks in case we'd like to merge them manually

    throw new Error(`Fail to merge tracks: \n${error.message}`);
  });

  return output;
}

export default curry(mergeTracks);
