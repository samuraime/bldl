#!/usr/bin/env node

import yargs from 'yargs';
import os from 'node:os';
import path from 'node:path';
import getTracks from './getTracks.js';
import downloadTracks from './downloadTracks.js';
import mergeTracks from './mergeTracks.js';

function getContext() {
  const argv = yargs(process.argv.slice(2))
    .scriptName('bldl')
    .usage('$0 [options] <input_url> [out_file]')
    .option('credential', {
      type: 'string',
      describe: 'Bilibili SESSDATA from browser Cookies',
    })
    .option('video-codec', {
      type: 'string',
      describe: 'Filter out video tracks by given codec, e.g. avc, hevc, av1, or more exact codec string',
    })
    .option('tmp-dir', {
      type: 'string',
      describe: 'Directory to save temporary tracks',
      default: path.resolve(os.tmpdir(), 'bldl'),
    })
    .option('keep-tmp-tracks', {
      type: 'boolean',
      describe: 'Whether to keep temporary tracks after merging',
      default: false,
    })
    .help()
    .argv;

  const {
    _: [url, output],
    credential,
    videoCodec,
    tmpDir,
    keepTmpTracks,
  } = argv;

  const videoCodecAlias = {
    avc: 'avc1',
    hevc: 'hev1',
    av1: 'av01',
  };

  return {
    url,
    output: output ? path.resolve(output) : undefined,
    credential,
    videoCodec: videoCodec && videoCodecAlias[videoCodec],
    tmpDir: path.resolve(tmpDir),
    keepTmpTracks,
  };
}

const context = getContext();

if (!context.url) {
  console.error('input_url is required');
  process.exit(1);
}

Promise.resolve(context.url)
  .then(getTracks(context))
  .then(downloadTracks(context))
  .then(mergeTracks(context))
  .then(console.log)
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
