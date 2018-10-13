#!/bin/bash

sudo apt update
sudo apt install -y git build-essential valac valadoc autoconf intltool libtool-bin automake libxml2-dev libgee-0.8-2 libgee-0.8-dev  gobject-introspection libgirepository1.0-dev

rm -rf /tmp/gxml
git clone https://gitlab.gnome.org/GNOME/gxml.git --branch 0.16.3 /tmp/gxml
cd /tmp/gxml
./autogen.sh
./configure --prefix=/usr/
make
sudo make install

rm -rf /tmp/gnome-shell-extensions-sync
git clone https://github.com/oae/gnome-shell-extensions-sync.git /tmp/gnome-shell-extensions-sync
cd /tmp/gnome-shell-extensions-sync
make install
busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…")'
make enable
