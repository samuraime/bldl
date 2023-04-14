import { execSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import settings from '../settings.js';
import getTracks from '../getTracks.js';
import downloadTracks from '../downloadTracks.js';
import mergeTracks from '../mergeTracks.js';

function makeCleanUpManager() {
  const handlers = [];

  function register(handler) {
    handlers.unshift(handler); // LIFO
  }

  async function start() {
    handlers.forEach((handler) => {
      try {
        handler(); // Have to be sync function since cleanup will be called in `exit` event
      } catch {
        // Ignore cleanup errors
      }
    });
  }

  return {
    register,
    start,
  };
}

function getContext(argv) {
  const videoCodecAlias = {
    avc: 'avc1',
    hevc: 'hev1',
    av1: 'av01',
  };

  return {
    url: argv.url,
    output: argv.output ? path.resolve(argv.output) : undefined,
    credential: argv.credential || settings.getCredential(),
    interactive: argv.interactive,
    videoCodec: argv.videoCodec && videoCodecAlias[argv.videoCodec],
    tmpDir: path.resolve(argv.tmpDir),
    keepTmpTracks: argv.keepTmpTracks,
    cleanup: makeCleanUpManager(),
  };
}

export default {
  command: '* <url> [output]',
  description: 'Download stream',
  builder: (yargs) => {
    yargs
      .positional('url', {
        type: 'string',
        describe: 'URL to download stream from',
      })
      .positional('output', {
        type: 'string',
        describe: 'Path to save stream to',
      })
      .option('credential', {
        type: 'string',
        describe: 'Bilibili SESSDATA from browser Cookies',
      })
      .option('interactive', {
        alias: 'i',
        type: 'boolean',
        describe: 'Interactively download streams',
        default: false,
      })
      .option('video-codec', {
        type: 'string',
        describe:
          'Filter out video tracks by given codec, e.g. avc, hevc, av1, or more exact codec string',
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
      });
  },
  handler: (argv) => {
    try {
      execSync('ffmpeg -version');
    } catch {
      // eslint-disable-next-line no-console
      console.error(
        'ffmpeg is required for merging tracks, try to download from https://ffmpeg.org/download.html'
      );
      process.exit(1);
    }

    const context = getContext(argv);

    process.on('SIGINT', () => {
      process.exit(130);
    });

    // The command will end up here, handle all cleanup things
    process.on('exit', (code) => {
      context.cleanup.start();
      process.exit(code);
    });

    return Promise.resolve(context.url)
      .then(getTracks(context))
      .then(downloadTracks(context))
      .then(mergeTracks(context))
      .then(console.log) // eslint-disable-line no-console
      .catch((error) => {
        console.error(error.message); // eslint-disable-line no-console
        process.exit(1);
      });
  },
};
