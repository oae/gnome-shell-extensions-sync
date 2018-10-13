# Extensions Sync

Syncs gnome shell extensions and their configurations across all gnome installations with the help of gist

![SS](https://i.imgur.com/2vJ89Zo.jpg)

## Installation

```bash
curl https://raw.githubusercontent.com/oae/gnome-shell-extensions-sync/master/installer.sh | bash
```

## Dependencies

* This extension depends on [gxml](https://gitlab.gnome.org/GNOME/gxml.git)

# Usage

1. Create a new gist from [here](https://gist.github.com/) I suggest you make it secret.
2. Create a new token from [here](https://github.com/settings/tokens/new). Only gist permission is needed since we edit the gists.
3. Open extension settings and fill gist id from first step and gist token from second step.
4. Enjoy!
