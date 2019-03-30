# Extensions Sync

Syncs gnome shell extensions and their configurations across all gnome installations with the help of gist

![SS](https://i.imgur.com/2vJ89Zo.jpg)

## Installation

### From [Git](https://github.com/oae/gnome-shell-extensions-sync)

```bash
curl https://raw.githubusercontent.com/oae/gnome-shell-extensions-sync/master/installer.sh | bash
```

### From [Ego](extensions.gnome.org)

* You can install it from link below
https://extensions.gnome.org/extension/1486/extensions-sync/

## Usage

1. Create a new gist from [here](https://gist.github.com/) I suggest you make it secret.
2. Create a new token from [here](https://github.com/settings/tokens/new). Only gist permission is needed since we edit the gists.
3. Open extension settings and fill gist id from first step and gist token from second step.
4. Enjoy!

## Debugging

* If you encounter a problem you can enable the debug logs with;

  ```sh
  busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'window.extensionsSync.debug = true;'
  ```

* Then trace them with;

  ```sh
  journalctl /usr/bin/gnome-shell -f -o cat | grep "\[extensions-sync\]"
  ```

## Notes

* Downloading from gist will do 3 things.
  * It will remove all extensions that are not exist in the gist.
  * It will install extensions that are listed in gist and update their settings.
  * It will update all the settings of installed the extensions.
  
* Uploading to gist will dump all the settings of the installed extensions(enabled/disabled) and put them in the gist with the below structure

  ```json
  {
    "description": "Extensions sync",
    "files": {
      "syncSettings": {
        "content": {
          "lastUpdatedAt": "time",
        }
      },
      "extensions": {
        "content": {
          "extension1": {
            "schema1": "schema1 settings",
            "schema2": "schema2 settings",
          },
          "extension2": {
            "schema1": "schema1 settings",
            "schema2": "schema2 settings",
          },
        }
      }
    }
  }
  ```
