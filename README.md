# Extensions Sync

[![ts](https://badgen.net/badge/icon/typescript?icon=typescript&label)](#)
[![deps](https://img.shields.io/david/oae/gnome-shell-extensions-sync)](#)
[![opensource](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](#)
[![licence](https://badges.frapsoft.com/os/gpl/gpl.png?v=103)](https://github.com/oae/gnome-shell-extensions-sync/blob/master/LICENSE)
[![latest](https://img.shields.io/github/v/release/oae/gnome-shell-extensions-sync)](https://github.com/oae/gnome-shell-extensions-sync/releases/latest)
[![compare](https://img.shields.io/github/commits-since/oae/gnome-shell-extensions-sync/latest/master)](https://github.com/oae/gnome-shell-extensions-sync/compare)

Syncs gnome shell extensions and their configurations across all gnome installations

![SS](https://i.imgur.com/XfXOQCB.png)

## Installation

### From [Git](https://github.com/oae/gnome-shell-extensions-sync)

```bash
git clone https://github.com/oae/gnome-shell-extensions-sync.git
cd ./gnome-shell-extensions-sync
yarn install
yarn build
ln -s "$PWD/dist" "$HOME/.local/share/gnome-shell/extensions/extensions-sync@elhan.io"
```

### From [Ego](extensions.gnome.org)

- You can install it from link below
  https://extensions.gnome.org/extension/1486/extensions-sync/

## Usage

## For Github

1. Create a new gist from [here](https://gist.github.com/) I suggest you make it secret.
2. Create a new token from [here](https://github.com/settings/tokens/new). Only gist permission is needed since we edit the gists.
3. Open extension settings, select the `Github` provider and fill gist id from first step and user token from second step.

## For Gitlab

1. Create a new snippet from [here](https://gitlab.com/snippets/new) I suggest you make it private.
2. Create a new token from [here](https://gitlab.com/profile/personal_access_tokens). Only api scope is needed.
3. Open extension settings, select the `Gitlab` provider and fill snippet id from first step and user token from second step.

## Development

- This extension is written in Typescript and uses webpack to compile it into javascript.
- Most dependencies have auto completion support thanks to [this amazing project](https://github.com/sammydre/ts-for-gjs) by [@sammydre](https://github.com/sammydre)
- To start development, you need nodejs installed on your system;

  - Clone the project

    ```sh
    git clone https://github.com/oae/gnome-shell-extensions-sync.git
    cd ./gnome-shell-extensions-sync
    ```

  - Install dependencies and build it

    ```sh
    yarn install
    yarn build
    ```

  - During development you can use `yarn watch` command to keep generated code up-to-date.
