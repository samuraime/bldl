import fs from 'node:fs';
import path from 'node:path';
import cliProgress from 'cli-progress';
import curry from 'lodash/fp/curry.js';
import { downloadTrack } from './utils.js';
import { formatTrack, formatFileSize } from './formats.js';

function shortTitle(title) {
  return title.length > 16 ? title.substring(0, 16).concat('...') : title;
}

function downloadTracks(context, { metadata, tracks }) {
  const multiBar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: ' {bar} | {title} | {track} | {transferred}/{size}',
    },
    cliProgress.Presets.shades_grey
  );

  const saveToDirectory = path.resolve(context.tmpDir, metadata.bvid);

  context.cleanup.register(() => {
    // Lazy evaluation in case we'd like to keep them in some error cases
    if (context.keepTmpTracks) {
      return undefined;
    }

    multiBar.stop();

    return fs.rmSync(saveToDirectory, { recursive: true });
  });

  const downloadedTracks = tracks.map((track) => {
    const bar = multiBar.create(1, 0, {
      title: shortTitle(metadata.title),
      track: formatTrack(track),
      transferred: 0,
      size: 'Unknown',
    });

    return downloadTrack({
      track,
      credential: context.credential,
      saveToDirectory,
      onProgress: ({ percent, transferred, total }) => {
        bar.update(percent, {
          transferred: formatFileSize(transferred),
          size: formatFileSize(total),
        });
      },
    })
      .then((downloadedTrackFile) => ({
        ...track,
        path: downloadedTrackFile,
      }))
      .finally(() => {
        bar.stop();
      });
  });

  return Promise.all(downloadedTracks)
    .then((updatedTracks) => ({
      metadata,
      tracks: updatedTracks,
    }))
    .finally(() => {
      multiBar.stop();
    });
}

export default curry(downloadTracks);
