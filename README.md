# Extensions Sync

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

* External Library bindings are located in `/usr/lib/girepository-1.0;`

## Dependencies

* GXml - https://gitlab.gnome.org/GNOME/gxml


## Documentations

* Devdocs - http://devdocs.baznga.org/
* GXml - https://valadoc.org/gxml-0.14/index.htm