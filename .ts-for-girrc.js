module.exports = {
    "environments": [
        "gjs"
    ],
    "modules": [
        "Gtk-4.0",
        "Soup-2.4",
        "St-1.0",
        "Shell-0.1"
    ],
    "prettify": false,
    "girDirectories": [
        "/usr/share/gir-1.0",
        "/usr/share/gnome-shell",
        "/usr/lib/mutter-8"
    ],
    "outdir": "./@types",
    "ignore": [
        "Gtk-3.0",
        "Gdk-3.0"
    ]
}