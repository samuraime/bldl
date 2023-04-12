import got from 'got';
import inquirer from 'inquirer';
import curry from 'lodash/fp/curry.js';
import { makeGotOptions } from './utils.js';
import { formatTrack } from './formats.js';

function parseJsonFromFirstMatch(string, regexp) {
  const matches = string.match(regexp);

  if (!matches?.length) {
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

const makeUGCMediaInfoHandler = (url) =>
  function getUGCMediaInfo(credential) {
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
  };

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

const makePGCEpisodeHandler = (url, episodeId) =>
  function getPGCEpisode(credential) {
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
  // UGC video bvid, BV1j4411W7F7
  if (/^BV\w+$/.test(url)) {
    return makeUGCMediaInfoHandler(`https://www.bilibili.com/video/${url}`);
  }

  // UGC video, https://www.bilibili.com/video/BV1j4411W7F7
  if (/\/video\/BV\w+/.test(url)) {
    return makeUGCMediaInfoHandler(url);
  }

  // PGC Season, https://www.bilibili.com/bangumi/play/ss12548
  if (/\/bangumi\/play\/ss\d+/.test(url)) {
    return makePGCEpisodeHandler(url);
  }

  // PGC Episode, https://www.bilibili.com/bangumi/play/ep199612
  const episodeId = url.match(/\/bangumi\/play\/ep(\d+)/)?.[1];

  if (episodeId) {
    return makePGCEpisodeHandler(url, episodeId);
  }

  throw new Error("Don't support to download streams from this type of URL");
}

function getBestVideoTracks(codec, tracks) {
  return [...tracks].filter((track) => !codec || track.codec.startsWith(codec));
}

function getBestTracks(videos, audios, filter) {
  return [
    ...getBestVideoTracks(filter.videoCodec, videos).slice(0, 1),
    ...audios.slice(0, 1),
  ];
}

function selectBestTracks(videos, audios) {
  const questions = [
    {
      type: 'list',
      name: 'video',
      message: 'Select a video stream to download',
      choices: videos.map((video, index) => ({
        name: formatTrack(video),
        value: index,
      })),
      loop: false,
    },
    {
      type: 'list',
      name: 'audio',
      message: 'Select an audio stream to download',
      choices: audios.map((audio, index) => ({
        name: formatTrack(audio),
        value: index,
      })),
      loop: false,
    },
  ];

  return inquirer
    .prompt(questions)
    .then((answers) => [videos[answers.video], audios[answers.audio]]);
}

function getTracks(context, url) {
  const getMediaInfo = findMediaInfoHandler(url);

  return getMediaInfo(context.credential).then(
    async ({ metadata, videos, audios }) => {
      const bestTracks = context.interactive
        ? await selectBestTracks(videos, audios)
        : getBestTracks(videos, audios, { videoCodec: context.videoCodec });

      return {
        metadata,
        tracks: bestTracks,
      };
    }
  );
}

export default curry(getTracks);
