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
  bldl <url> [output]               Download stream                    [default]
  bldl set-credential <credential>  Store credential for downloading streams

Positionals:
  url     URL to download stream from                                   [string]
  output  Path to save stream to                                        [string]

Options:
  --version          Show version number                               [boolean]
  --credential       Bilibili SESSDATA from browser Cookies             [string]
  --video-codec      Filter out video tracks by given codec, e.g. avc, hevc, av1
                     , or more exact codec string                       [string]
  --tmp-dir          Directory to save temporary tracks
                                         [string] [default: "{OS_TMP_DIR}/bldl"]
  --keep-tmp-tracks  Whether to keep temporary tracks after merging
                                                      [boolean] [default: false]
  --help             Show help                                         [boolean]
```

### Examples

```sh
bldl set-credential {SESSDATA_FROM_COOKIES} # Store Bilibli auth credential for downloading high quality streams
bldl https://www.bilibili.com/video/BV1ac411E7jr
```

Or for one-off use:

```sh
npx bldl --credential={SESSDATA_FROM_COOKIES} https://www.bilibili.com/video/BV1ac411E7jr
```

## License

[MIT](./LICENSE)
