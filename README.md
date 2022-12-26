# bamborak

swobodny serbski TTS-system

## instalacija

### docker
Za instalaciju trjeba so poprawom jenož docker a node.js, node.js trjebaće jenož hdyž chceće frontend wužiwać.

Hdyž šće sej waše modele a konfiguracije dele ćahnyli, połožiće tute to rjadowaka backend/models (rjadowak models dyrbiće sami činić).
Potom njedyrbiće poprawom ničo wjace změnić, hdyž pak sće sami modele instalowali, dyrbiće hišće config.js (w rjadowaku backend) změnić.

twarće container

```console
docker build -t bamborak .
```

startujće container

```console
docker run -p 8080:8080 bamborak
```

## extension

Nawigěrujeće k chrome://extensions/.
Potom aktiwěrujeće "Entwicklermodus" (horeka naprawo).
Horeka nalěwo stwóčiće jenož hišće horeka nalěwo na "Entpackte Erweiterung laden".

## kontatk
Jeli maće hišće prašenje, problemy abo chceće mi něšto druheho prajić. Pisaće mi rady mailku: bamborak@gaussia.de.
