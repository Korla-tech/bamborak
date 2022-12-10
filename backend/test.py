import requests
r = requests.post("http://127.0.0.1:8080/api/tts", json={
    "text": "Gmejna Pančicy-Kukow a Domowina chcetej w Muzej Ćišinskeho, kotryž je w Pančičansko-Kukowskej šuli zaměstnjeny, ponowić a zno­wa wuhotować. Wčera su sej wjesnjanosta Markus Kreuz (CDU) a zastupnicy Domowiny – přitomni běchu županka Kamjenskeje župy „Michał Hórnik“ Diana Wowčerjowa, předsyda Pančičansko-Kukowskeje Domowinskeje skupiny Pětr Korjeńk, projektna wobdźěłarka Trudla Kuringowa, regionalna rěčnica Domowiny za Kamjenski region Katharina Jurkowa a referent Domowiny za kulturu a wukraj Clemens Škoda – trěbne podpisane zrěčenje wuměnili. Wo tym informuje medijowy rěčnik třěšneho zwjazka Marcel Brauman.",
    "speaker_id": "korla"
})

print("hotowe")
