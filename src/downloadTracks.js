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

  const downloadedTracks = tracks.map((track) => {
    const bar = multiBar.create(1, 0, {
      title: metadata.title,
      mimeType: track.mimeType,
      codec: track.codec,
      transferred: 0,
      size: 'Unknown',
    });

    return downloadTrack({
      track,
      credential: context.credential,
      saveToDirectory: path.resolve(context.tmpDir, metadata.title),
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
