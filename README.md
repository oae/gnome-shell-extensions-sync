# Extensions Sync

## Dependencies

```bash
sudo apt install git build-essential valac valadoc autoconf intltool libtool-bin automake libxml2-dev libgee-0.8-2 libgee-0.8-dev  gobject-introspection libgirepository1.0-dev
git clone https://gitlab.gnome.org/GNOME/gxml.git
cd gxml
./autogen.sh
./configure --prefix=/usr/
make
sudo make install
```

## Installation

```bash
git clone https://github.com/oae/gnome-shell-extensions-sync.git
make install
```

## Development

* Open looking glass from bash

    ```bash
    gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell --method org.gnome.Shell.Eval 'Main.lookingGlass.toggle();'
    ```

* Reload shell from bash

    ```bash
    busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…")'
    ```

* Watch logs from extension

    ```bash
    journalctl /usr/bin/gnome-shell -f -o cat | grep "\[extensions-sync\]"
    ```

* External Libraries

    - Library bindings can be found in 
        - `/usr/lib/girepository-1.0`
        - `/usr/share/gir-1.0`

    - To extract documentation from them you can use following command

        ```bash
        mkdir docs
        g-ir-doc-tool -l gjs /usr/share/gir-1.0/libxml2-2.0.gir -o ./docs
        ```


## Documentations

* Devdocs - http://devdocs.baznga.org/
* GXml - https://valadoc.org/gxml-0.14/index.htm
* gjs examples - https://github.com/optimisme/gjs-examples/
* gjs helpers - https://github.com/satya164/gjs-helpers


## Gist Structure

```json
{
  "description": "Extensions sync",
  "files": {
    "syncSettings": {
      "content": {
        "lastUpload": "time",
        "shellVersion": "gnome shell version"
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
