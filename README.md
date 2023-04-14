# bldl

> Just another CLI tool for downloading Bilibili streams

## Install

Prerequisites: install [ffmpeg](https://ffmpeg.org/download.html) for merging tracks and add it to env path. For Homebrew users:

```sh
brew install ffmpeg
```

```sh
npm install -g bldl
```

## How to use

`bldl --help`

```
Commands:
  bldl <url> [output]      Download stream                             [default]
  bldl login <credential>  Login to download higher quality streams
  bldl whoami              Display Bilibili username

Positionals:
  url     URL to download stream from                                   [string]
  output  Path to save stream to                                        [string]

Options:
  --version          Show version number                               [boolean]
  --credential       Bilibili SESSDATA from browser Cookies             [string]
  -i, --interactive      Interactively download streams
                                                      [boolean] [default: false]
  --video-codec      Filter out video tracks by given codec, e.g. avc, hevc, av1
                     , or more exact codec string                       [string]
  --audio-codec      Filter out audio tracks by given codec             [string]
  --tmp-dir          Directory to save temporary tracks
                                         [string] [default: "{OS_TMP_DIR}/bldl"]
  --keep-tmp-tracks  Whether to keep temporary tracks after merging
                                                      [boolean] [default: false]
  --help             Show help                                         [boolean]
```

### Examples

```sh
bldl login {SESSDATA_FROM_COOKIES} # Store Bilibli auth credential for downloading high quality streams

bldl BV1j4411W7F7 # UGC video
bldl https://www.bilibili.com/video/BV1j4411W7F7  # UGC video
bldl https://www.bilibili.com/bangumi/play/ep199612 # PGC episode
bldl https://www.bilibili.com/bangumi/play/ss12548 # PGC season
```

Or for one-off use:

```sh
npx bldl --credential={SESSDATA_FROM_COOKIES} https://www.bilibili.com/video/BV1j4411W7F7
```

## License

[MIT](./LICENSE)
