#!/bin/bash

rm -rf /tmp/gnome-shell-extensions-sync
git clone https://github.com/oae/gnome-shell-extensions-sync.git /tmp/gnome-shell-extensions-sync
cd /tmp/gnome-shell-extensions-sync
make install
busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…")'
