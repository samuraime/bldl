import fs from 'node:fs/promises';
import { rmSync } from 'node:fs';
import path from 'node:path';
import cliProgress from 'cli-progress';
import curry from 'lodash/fp/curry.js';
import { downloadTrack } from './utils.js';

function downloadTracks(context, { metadata, tracks }) {
  const multiBar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: ' {bar} | {title} | {mimeType} | {codec} | {transferred}/{size}',
    },
    cliProgress.Presets.shades_grey,
  );

  const saveToDirectory = path.resolve(context.tmpDir, metadata.title);

  context.cleanup.register(() => {
    if (context.keepTmpTracks) { // Lazy evaluation in case we'd like to keep them in some error cases
      return;
    }

    return rmSync(saveToDirectory, { recursive: true });
  });

  const downloadedTracks = tracks.map((track) => {
    const bar = multiBar.create(1, 0, {
      title: metadata.title,
      mimeType: track.mimeType,
      codec: track.codec,
      transferred: 0,
      size: 'Unknown',
    });

    context.cleanup.register(() => bar.stop());

    return downloadTrack({
      track,
      credential: context.credential,
      saveToDirectory,
      onProgress: ({ percent, transferred, total }) => {
        bar.update(percent, { transferred, size: total });
      },
    })
      .then(((downloadedTrackFile) => ({
        ...track,
        path: downloadedTrackFile,
      })))
      .finally(() => {
        bar.stop();
      });
  });

  return Promise.all(downloadedTracks)
    .then((tracks) => ({
      metadata,
      tracks,
    }))
    .finally(() => {
      multiBar.stop();
    });
}

export default curry(downloadTracks);
