# bldl

> Just another CLI tool for downloading Bilibili streams

## Install

```sh
npm install -g bldl
```

And require [ffmpeg](https://ffmpeg.org/download.html) for merging track files, for Homebrew users:

```sh
brew install ffmpeg
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

Basic

```sh
bldl https://www.bilibili.com/video/BV1ac411E7jr
```

For high quality (大会员) streams, need to set your credential, just grab `SESSDATA` from your browser cookies.

```sh
bldl --credential={SESSDATA_FROM_COOKIES} https://www.bilibili.com/video/BV1ac411E7jr
```

## License

[MIT](./LICENSE)
