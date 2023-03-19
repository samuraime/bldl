import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import stream from 'node:stream';
import { promisify } from 'node:util';
import got from 'got';

const pipeline = promisify(stream.pipeline);

function makeDirectoryIfNeeded(directoryPath) {
  const resolvedPath = path.resolve(directoryPath);

  return fs.mkdir(resolvedPath, { recursive: true })
    .then(() => resolvedPath)
    .catch(() => {
      throw new Error(`Fail to create directory: ${directoryPath}`)
    });
}

export async function downloadTrack({ track, credential, saveToDirectory, onProgress }) {
  await makeDirectoryIfNeeded(saveToDirectory);

  const urlPath = track.url.split('?')[0];

  const saveToFile = path.resolve(saveToDirectory, `${track.type}${path.extname(urlPath)}`);

  return pipeline(
    got.stream(track.url, makeGotOptions(credential))
      // {percent, transferred, total}
      .on('downloadProgress', onProgress),
    createWriteStream(saveToFile),
  )
    .then(() => saveToFile)
    .catch((error) => {
      throw new Error(`Fail to download stream: ${track.url}`)
    });
}

export function makeGotOptions(credential) {
  const defaultHTTPHeaders = {
    origin: 'https://www.bilibili.com',
    referer: 'https://www.bilibili.com',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
  };

  return {
    headers: {
      ...defaultHTTPHeaders,
      cookie: `SESSDATA=${credential}`,
    },
  };
}
