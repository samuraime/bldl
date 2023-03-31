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

function getPlayInfoFromPlayAPIResponse(data) {
  const { video, audio } = data.dash;

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

function getUGCPlayInfoFromScript(html) {
  const { data } = parseJsonFromFirstMatch(
    html,
    /<script>window.__playinfo__=(.+?)<\/script>/s
  );

  return getPlayInfoFromPlayAPIResponse(data);
}

function getUGCMetadataFromScript(html) {
  const { videoData } = parseJsonFromFirstMatch(
    html,
    /<script>window.__INITIAL_STATE__=(.+?);\(/s
  );

  return {
    title: videoData.title,
    cover: videoData.pic,
    duration: videoData.duration,
    bvid: videoData.bvid,
  };
}

function getUGCMediaInfo(credential, url) {
  return got
    .get(url, makeGotOptions(credential, url))
    .text()
    .then((html) =>
      Promise.all([
        getUGCMetadataFromScript(html),
        getUGCPlayInfoFromScript(html),
      ])
    )
    .then(([metadata, { videos, audios }]) => ({
      metadata,
      videos,
      audios,
    }));
}

const getPGCPlayParams = (episodeId) => (html) => {
  const { title, episodes } = parseJsonFromFirstMatch(
    html,
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json">(.+?)<\/script>/is
  ).props.pageProps.dehydratedState.queries[0].state.data.mediaInfo;

  const episode = episodeId
    ? episodes.find(({ ep_id: id }) => id.toString() === episodeId)
    : episodes[0]; // Should be from a season, select first episode

  return {
    metadata: {
      title: [title, episode.long_title || episode.title]
        .filter(Boolean)
        .join('-'),
      cover: episode.cover,
      duration: episode.duration,
      bvid: episode.bvid,
    },
    playAPIParams: {
      aid: episode.aid,
      cid: episode.cid,
      ep_id: episode.ep_id,
      support_multi_audio: true,
      fnval: 4048,
    },
  };
};

function getPGCPlayInfo(gotOptions) {
  return got
    .get('https://api.bilibili.com/pgc/player/web/playurl', gotOptions)
    .json()
    .then(({ result }) => result)
    .then(getPlayInfoFromPlayAPIResponse)
    .catch(() => {
      throw new Error('Fail to get PGC play info');
    });
}

const getPGCEpisode = (episodeId) => (credential, url) => {
  const gotOptions = makeGotOptions(credential);

  return got
    .get(url, gotOptions)
    .text()
    .then(getPGCPlayParams(episodeId))
    .then(({ metadata, playAPIParams }) =>
      Promise.all([
        metadata,
        getPGCPlayInfo({
          ...gotOptions,
          searchParams: playAPIParams,
        }),
      ])
    )
    .then(([metadata, { videos, audios }]) => ({
      metadata,
      videos,
      audios,
    }));
};

function findMediaInfoHandler(url) {
  // https://www.bilibili.com/video/BV1ac411E7jr
  if (/\/video\/BV\w+/.test(url)) {
    // UGC
    return getUGCMediaInfo;
  }

  // https://www.bilibili.com/bangumi/play/ss12548
  if (/\/bangumi\/play\/ss\d+/.test(url)) {
    // PGC Season
    return getPGCEpisode();
  }

  // https://www.bilibili.com/bangumi/play/ep199612
  const episodeId = url.match(/\/bangumi\/play\/ep(\d+)/)?.[1];

  if (episodeId) {
    // PGC Episode
    return getPGCEpisode(episodeId);
  }

  throw new Error("Don't support to download streams from this type of URL");
}

function getBestVideoTracks(codec, tracks) {
  return [...tracks].filter((track) => !codec || track.codec.startsWith(codec));
}

function getTracks(context, url) {
  const getMediaInfo = findMediaInfoHandler(url);

  return getMediaInfo(context.credential, url).then(
    ({ metadata, videos, audios }) => ({
      metadata,
      tracks: [
        ...getBestVideoTracks(context.videoCodec, videos).slice(0, 1),
        ...audios.slice(0, 1),
      ],
    })
  );
}

export default curry(getTracks);
