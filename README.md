# Extensions Sync

[![ts](https://badgen.net/badge/icon/typescript?icon=typescript&label)](#)
[![opensource](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](#)
[![licence](https://badges.frapsoft.com/os/gpl/gpl.png?v=103)](https://github.com/oae/gnome-shell-extensions-sync/blob/master/LICENSE)
[![latest](https://img.shields.io/github/v/release/oae/gnome-shell-extensions-sync)](https://github.com/oae/gnome-shell-extensions-sync/releases/latest)
[![compare](https://img.shields.io/github/commits-since/oae/gnome-shell-extensions-sync/latest/master)](https://github.com/oae/gnome-shell-extensions-sync/compare)

Syncs gnome shell keybindings, tweaks settings and extensions with their configuration across all gnome installations

|               Provider               |              Synced Data             |            Other Settings            |
|:------------------------------------:|:------------------------------------:|:------------------------------------:|
| ![](https://i.imgur.com/4Sv3Jus.png) | ![](https://i.imgur.com/Ii6Q8w3.png) | ![](https://i.imgur.com/OvDy80f.png) |

## Installation

### From [Git](https://github.com/oae/gnome-shell-extensions-sync)

```bash
git clone https://github.com/oae/gnome-shell-extensions-sync.git
cd ./gnome-shell-extensions-sync
yarn install
yarn build
ln -s "$PWD/dist" "$HOME/.local/share/gnome-shell/extensions/extensions-sync@elhan.io"
```

### From [Ego](https://extensions.gnome.org)

You can install it from [**here**](https://extensions.gnome.org/extension/1486/extensions-sync/)
  

## Usage

- You can select the data types that are going to be saved in the settings.

## For Github

1. Create a new gist from [here](https://gist.github.com/) I suggest you make it secret. You will need the gist id for this. You can find it in the url after username. For example on gist url `https://gist.github.com/username/f545156c0083f7eaefa44ab69df4ec37`, gist id will be `f545156c0083f7eaefa44ab69df4ec37`. [Guide](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists)
2. Create a new token from [here](https://github.com/settings/tokens/new). Only **gist permission** is needed since we edit the gists. [Guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
3. Open extension settings, select the `Github` provider and fill gist id from first step and user token from second step.

## For Gitlab

1. Create a new snippet from [here](https://gitlab.com/-/snippets/new) I suggest you make it private. You will need the snippet id for this. You can find it in the url. For example on snippet url `https://gitlab.com/-/snippets/324234234`, snippet id will be `324234234`. [Guide](https://docs.gitlab.com/ee/user/snippets.html#create-snippets)
2. Create a new token from [here](https://gitlab.com/-/profile/personal_access_tokens). Only **api scope** is needed. [Guide](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token)
3. Open extension settings, select the `Gitlab` provider and fill snippet id from first step and user token from second step.

## For Local

1. Select a file that has read/write permission by your active user. (default backup file is in `~/.config/extensions-sync.json`)

## Cli Usage

You can trigger upload download operations using busctl.

```sh
busctl --user call org.gnome.Shell /io/elhan/ExtensionsSync io.elhan.ExtensionsSync save # uploads to server
busctl --user call org.gnome.Shell /io/elhan/ExtensionsSync io.elhan.ExtensionsSync read # downloads to pc
```

## Development

- This extension is written in Typescript and uses rollup to compile it into javascript.
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
    ln -s "$PWD/dist" "$HOME/.local/share/gnome-shell/extensions/extensions-sync@elhan.io"
    ```

  - During development you can use `yarn watch` command to keep generated code up-to-date.
