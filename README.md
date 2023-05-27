# bamborak

swobodny serbski TTS-system

Móžeće bamborak na https://gaussia.de/bamborak/ wuspytać.

## instalacija

### docker
Za instalaciju trjeba so poprawom jenož docker a node.js, node.js trjebaće jenož hdyž chceće frontend wužiwać.

Modele a konfiguracije namakaće tu https://drive.google.com/drive/folders/14ji4R4JSmgSqVMKf3mCvHgNkKxsqC4Rv?usp=sharing.

Hdyž šće sej waše modele a konfiguracije dele ćahnyli, połožiće tute do rjadowaka backend/models (rjadowak models dyrbiće sami činić).
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
Potom aktiwěrujeće "Entwicklermodus" (horjeka naprawo).
Horjeka nalěwo stłóčiće jenož hišće horjeka nalěwo na "Entpackte Erweiterung laden".
Nětkole wuzwolće rjadowak "extension".

## kontakt
Jeli maće hišće prašenje, problemy abo chceće mi něšto druheho prajić. Pisaće mi rady mailku: bamborak@gaussia.de.
