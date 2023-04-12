// eslint-disable-next-line import/prefer-default-export
export function formatTrack(track) {
  if (track.type === 'audio') {
    return `${track.mimeType} ${track.codec}`;
  }

  return `${track.width}x${track.height}@${track.frameRate} ${track.mimeType} ${track.codec}`;
}
