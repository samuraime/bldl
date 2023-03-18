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
bldl [options] input_url [out_file]

Options:
  --version          Show version number                               [boolean]
  --with-credential  Bilibili SESSDATA from browser Cookies             [string]
  --tmp-dir          Directory to save temporary tracks
                                 [string] [default: "OS_TMP_DIR/bili-downloads"]
  --keep-tracks      Whether to keep temporary tracks after merging
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
bldl --with-credential={SESSDATA_FROM_COOKIES} https://www.bilibili.com/video/BV1ac411E7jr
```

## License

[MIT](./LICENSE)
