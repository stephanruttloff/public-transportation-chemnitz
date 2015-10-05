CVAG - Haltestellen
===================

Interaktiver [CVAG](http://www.cvag.de/) Haltestellenplan. Zeigt Daten der [Echtzeitauskunft](http://www.cvag.de/de/Fahrplan/Echtzeitauskunft_5779.html) an.

Technische Basis
================

**Backend**: [Node.js](https://nodejs.org/) unter anderem mit den Modulen
- [express](https://www.npmjs.com/package/express)
- [serve-static](https://www.npmjs.com/package/serve-static)
- [request](https://www.npmjs.com/package/request)
- [underscore](https://www.npmjs.com/package/underscore)

[package.json](https://git.ruttloff.org/rudzn/CVAG/blob/master/package.json)

Das Backend dient als Proxy zur CVAG API (Header setzen, [Geokoordinaten](https://github.com/CodeforChemnitz/Haltestellen/blob/gh-pages/haltestellen.json) hinzufügen).

**Frontend**: [Angular.js](https://angularjs.org/) unter anderem mit den Components
- [angular-moment](https://github.com/urish/angular-moment)
- [angular-timer](https://github.com/siddii/angular-timer)
- [angularJs-geolocation](https://github.com/arunisrael/angularjs-geolocation)
- [humanize-duration](https://github.com/EvanHahn/HumanizeDuration.js)
- [angular-material](https://github.com/angular/bower-material)
- [ngmap](https://github.com/allenhwkim/angularjs-google-maps)

[bower.json](https://git.ruttloff.org/rudzn/CVAG/blob/master/bower.json)

Deployment
==========

```
> git clone https://git.ruttloff.org/rudzn/CVAG.git && cd CVAG
> npm install
> npm start
```

`npm install` startet automatisch Bower und Grunt tasks um Components zu laden, mergen und minifien. Die fertig gebauten files liegen im Anschluss unter `./public`.

Development
===========

```
> git clone https://git.ruttloff.org/rudzn/CVAG.git && cd CVAG
> npm install
> npm run dev
```

`npm run dev` hält Browser während der Entwicklung mit [livereload.js](https://github.com/livereload/livereload-js) aktuell. Sourcen werden überwacht und bei Bedarf neu gebaut.

Tests
=====

![BrowserStack](src/img/BrowserStack.png)

Cross-Browser Tests wurden durch die freundliche Unterstützung von [BrowserStack](https://www.browserstack.com/) ermöglicht.

Lizenz
======

WTFPL