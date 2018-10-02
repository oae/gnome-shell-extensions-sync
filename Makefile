# Basic Makefile

UUID = extensions-sync@elhan.io
BASE_MODULES = extension.js metadata.json LICENSE.md README.md
EXTRA_MODULES = utils.js sync.js settings.js request.js
TOLOCALIZE =
INSTALLBASE = ~/.local/share/gnome-shell/extensions
INSTALLNAME = extensions-sync@elhan.io

all: extension

clean:
	rm -f ./schemas/gschemas.compiled

extension: ./schemas/gschemas.compiled

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.extensions-sync.gschema.xml
	glib-compile-schemas ./schemas/

install: install-local

enable:
	gnome-shell-extension-tool -e $(UUID)

disable:
	gnome-shell-extension-tool -d $(UUID)

reload:
	gnome-shell-extension-tool -r $(UUID)

install-local: _build
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	cp -r ./_build/* $(INSTALLBASE)/$(INSTALLNAME)/
	-rm -fR _build
	echo done

zip-file: _build
	cd _build ; \
	zip -qr "$(UUID).zip" .
	mv _build/$(UUID).zip ./
	-rm -fR _build

_build: all
	-rm -fR ./_build
	mkdir -p _build
	cp -R $(BASE_MODULES) $(EXTRA_MODULES) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale
	for l in $(MSGSRC:.po=.mo) ; do \
		lf=_build/locale/`basename $$l .mo`; \
		mkdir -p $$lf; \
		mkdir -p $$lf/LC_MESSAGES; \
		cp $$l $$lf/LC_MESSAGES/nos-dash.mo; \
	done;


#What does the first "-" mean at the beginning of the line in a Makefile ?
#It means that make itself will ignore any error code from rm.
#In a makefile, if any command fails then the make process itself discontinues
#processing. By prefixing your commands with -, you notify make that it should
#continue processing rules no matter the outcome of the command.

#mkdir -p, --parents no error if existing, make parent directories as needed



