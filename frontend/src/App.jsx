import {
  Download,
  Pause,
  PlayArrow,
  ReplayOutlined,
  VolumeUp,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Option,
  Select,
  Sheet,
  Typography,
} from "@mui/joy";
import { CssVarsProvider } from "@mui/joy/styles";

import Textarea from "@mui/joy/Textarea";
import { Stack } from "@mui/system";
import { useEffect, useRef, useState } from "react";

import plapadu from "/plapadu.mp3";
import bamborak from "/bamborak.mp3";

import { url } from "./config.js";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [text, setText] = useState("");
  const [ID, setID] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const audio = useRef();

  const audio_blob = useRef();

  const synthesize = () => {
    if (ID === "") {
      setOpen(true);
      setError("Dyrbiš sebi rěčnika wuzwolić!");
      return;
    }
    if (text === "") {
      setOpen(true);
      setError("Dyrbiš tekst zapodać!");
      return;
    }
    if (text.length > 700) {
      setOpen(true);
      setError("Zapodaj tekst z < 700 znamješkami!");
      return;
    }
    setIsLoading(true);
    fetch(`${url}/api/tts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        speaker_id: ID,
      }),
    }).then((response) => {
      response.blob().then((blob) => {
        console.log(blob);
        if (blob.type == "application/json") {
          var myReader = new FileReader();
          myReader.onload = function (event) {
            setOpen(true);
            setError(JSON.stringify(myReader.result));
            console.log(JSON.stringify(myReader.result));
          };
          myReader.readAsText(blob);
        }
        audio_blob.current = blob;
        let blobUrl = URL.createObjectURL(blob);
        audio.current = new Audio(blobUrl);
        audio.current.play();
        setIsLoading(false);
        setIsLoaded(true);
        setIsPlaying(true);
      });
    });
  };

  useEffect(() => {
    fetch(`${url}/api/fetch_speakers/`).then((response) =>
      response.json().then((data) => {
        setSpeakers(data);
      })
    );
  }, []);

  return (
    <CssVarsProvider>
      <Box
        sx={{
          width: "100vw",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={2}
          sx={{
            maxWidth: "500px",
            display: "flex",
            justifyContent: "center",
            width: "100%",
            flexDirection: "column",
          }}
        >
          <Typography level="display1" textAlign={"center"}>
            bamborak
          </Typography>
          <Typography level="h5" textAlign={"center"}>TTS-system za hornjoserbšćinu</Typography>
          <Select
            color="primary"
            placeholder="wuzwol sebi hłós"
            variant="soft"
            value={ID}
            onChange={(e, values) => {
              setID(values);
            }}
          >
            {speakers.map((speaker) => {
              return (
                <Option value={speaker.id} key={speaker.id}>
                  {speaker.name}
                </Option>
              );
            })}
          </Select>
          <Textarea
            color="primary"
            minRows={3}
            placeholder="zapisaj tu twój tekst"
            size="lg"
            variant="soft"
            sx={{ width: "100%" }}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
          />
          <Button
            onClick={null}
            variant="soft"
            onClickCapture={synthesize}
            startDecorator={
              isLoading ? <CircularProgress variant="soft" /> : <VolumeUp />
            }
          >
            tekst sebi naposkać
          </Button>
          {isLoaded ? (
            <Sheet
              color="primary"
              variant="soft"
              sx={{
                height: "50px",
                padding: "5px",
                borderRadius: "20px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-evenly",
                alignItems: "center",
              }}
            >
              <Button
				title="pause/continue"
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  if (isPlaying) {
                    audio.current.pause();
                  } else {
                    audio.current.play();
                  }
                }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </Button>
              <Button
				title="replay"
                onClick={() => {
                  audio.current.currentTime = 0;
                  audio.current.play();
                  setIsPlaying(true);
                }}
              >
                <ReplayOutlined />
              </Button>
              <Button
				title="download"
                onClick={() => {
                  var a = document.createElement("a");
                  document.body.appendChild(a);
                  a.style = "display: none";
                  let url = window.URL.createObjectURL(audio_blob.current);
                  a.href = url;
                  a.download = "bamborak.mp3";
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                <Download />
              </Button>
            </Sheet>
          ) : null}
          {open ? (
            <Alert
              color="danger"
              size="lg"
              variant="soft"
              startDecorator={<Warning />}
            >
              {error}
            </Alert>
          ) : null}
          <Typography level="h2">Što je bamborak?</Typography>
          <Typography>
            Bamborak je TTS-system za hornjoserbšćinu. TTS je jendźelsce a stej za tekst k rěči.
			Bamborak je TTS-system na basy neuronalneje syće.
			Z neuronalnej syću móže bamborak přirodnu syntezu stworić.
          </Typography>
          <Typography level="h2">
            Kak móžu bamborak za swójske projekty wužiwać?
          </Typography>
          <Typography>
            Namakaće projekt bamborak tež na <a href="https://github.com/Korla-tech/bamborak">Github</a>. Tam so potom
            wšitko dalše wopisuje.
          </Typography>
          <Typography level="h2">Čehodla sym bamborak stworił?</Typography>
          <Typography>
            Před bamborakom dawaše jenož jedyn TTS-system za hornjoserbšćinu. -
			To bě plapadu wot prof. Edwarda Wornarja. System běži pak jenož na Apple-ličakach a dyrbi so najprjedy instalować.
			Tohodla sym swójski system stworił. Tež hdyž bu dotal jenož z 2500 hornjoserbskimi sadami trenowany ma so kwalita přichodnje hišće polěpšić - poskajće raz sami  (<a href="#test_sentence">testowa sadźba</a>):
          </Typography>
          <Typography>
            <a href="https://github.com/firedemon/plapadu">Plapadu</a> - Prof. Dr. Eduard Werner (institut za sorabistiku):
          </Typography>
          <audio controls>
            <source src={plapadu} />
          </audio>
          <Typography>Bamborak - Korla Baier:</Typography>
          <audio controls>
            <source src={bamborak} />
          </audio>
          <Typography level="h2">Kak funguje bamborak?</Typography>
          <Typography>
            Bamborak funguje na basy neuronalneje syće.
			To rěka, zo sym dyrbjał tysacore sady nahrawać. Z tutymi sadami sym potom model picował.
			Na kóncu maš potom model z kotrymž móžeš sebi kóždu serbsku sadu předčitać dać - a to potom tež zrozumić.
          </Typography>
          <Typography level="h2">Dalše informacije:</Typography>
          <Typography>
            rěčnik - Korla Baier; trening - Korla Baier; techniske přesadźenje -
            Korla Baier
          </Typography>
<Typography>✉️ <a title="přez mejlowy program" href="mailto:bamborak@gaussia.de?subject=M%C3%B3j%20feedback%20za%20bamboraka">kontakt/feedback</a></Typography>
<hr></hr>
<Typography>testowa sadźba:</Typography>
<Typography variant="caption" display="block" gutterBottom id="test_sentence">
<i>Gmejna Pančicy-Kukow a Domowina chcetej w Muzej Ćišinskeho, kotryž je w Pančičansko-Kukowskej šuli zaměstnjeny, ponowić a zno­wa wuhotować. Wčera su sej wjesnjanosta Markus Kreuz (CDU) a zastupnicy Domowiny – přitomni běchu županka Kamjenskeje župy „Michał Hórnik“ Diana Wowčerjowa, předsyda Pančičansko-Kukowskeje Domowinskeje skupiny Pětr Korjeńk, projektna wobdźěłarka Trudla Kuringowa, regionalna rěčnica Domowiny za Kamjenski region Katharina Jurkowa a referent Domowiny za kulturu a wukraj Clemens Škoda – trěbne podpisane zrěčenje wuměnili. Wo tym informuje medijowy rěčnik třěšneho zwjazka Marcel Brauman.
</i></Typography>
        </Stack>
      </Box>
    </CssVarsProvider>
  );
}

export default App;
