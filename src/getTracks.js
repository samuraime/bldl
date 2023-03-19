import got from 'got';
import curry from 'lodash/fp/curry.js';
import { makeGotOptions } from './utils.js';

function parseJsonFromFirstMatch(string, regexp) {
  const matches = string.match(regexp);

  if (!matches.length) {
    throw new Error('Fail to search JSON string');
  }

  return JSON.parse(matches[1]);
}

function getPlayInfoFromScript(html) {
  const { video, audio } = parseJsonFromFirstMatch(
    html,
    /<script>window.__playinfo__=(.+?)<\/script>/s,
  ).data.dash;

  return {
    videos: video.map((stream) => ({
      quality: stream.id,
      mimeType: stream.mimeType,
      codec: stream.codecs,
      frameRate: stream.frameRate,
      width: stream.width,
      height: stream.height,
      url: stream.baseUrl,
      type: 'video',
    })),
    audios: audio.map((stream) => ({
      mimeType: stream.mimeType,
      codec: stream.codecs,
      url: stream.baseUrl,
      type: 'audio',
    })),
  };
}

function getVideoInfoFromScript(html) {
  const { videoData } = parseJsonFromFirstMatch(
    html,
    /<script>window.__INITIAL_STATE__=(.+?);\(/s,
  );

  return {
    title: videoData.title,
    cover: videoData.pic,
    duration: videoData.duration,
  };
}

function getPlayInfo(credential, url) {
  return got
    .get(url, makeGotOptions(credential))
    .text()
    .then((html) => Promise.all([
      getVideoInfoFromScript(html),
      getPlayInfoFromScript(html),
    ]))
    .then(([metadata, { videos, audios }]) => ({
      metadata,
      videos,
      audios,
    }));
}

function getBestVideoTracks(codec, tracks) {
  return [...tracks].filter((track) => (
    !codec || track.codec.startsWith(codec)
  ));
}

function getTracks(context, url) {
  return getPlayInfo(context.credential, url)
    .then(({ metadata, videos, audios }) => ({
      metadata,
      tracks: [
        ...getBestVideoTracks(context.videoCodec, videos).slice(0, 1),
        ...audios.slice(0, 1),
      ],
    }));
}

export default curry(getTracks);
