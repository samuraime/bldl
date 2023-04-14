import { partial } from 'filesize';

// eslint-disable-next-line import/prefer-default-export
export function formatTrack(track) {
  if (track.type === 'audio') {
    return `${track.mimeType} ${track.codec}`;
  }

  return `${track.mimeType} ${track.width}x${track.height}@${track.frameRate} ${track.codec}`;
}

export const formatFileSize = partial({ pad: true });
