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
    fetch(`${url}/api/tts`, {
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
    fetch(`${url}/api/fetch_speakers`).then((response) =>
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
          <Typography level="h5">tts-system za hornjoserbšćinu</Typography>
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
                onClick={() => {
                  audio.current.currentTime = 0;
                  audio.current.play();
                  setIsPlaying(true);
                }}
              >
                <ReplayOutlined />
              </Button>
              <Button
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
            Bamborak je tts-sysem za hornjoserbšćinu. TTS je jendźelsce a stej
            za tekst k rěči. Bamborak je TTS-system na basy neuronalnej syći. Z
            neuronalnej syću móže bamborak přirodnu syntezu stworić.
          </Typography>
          <Typography level="h2">
            Kak móžu bamborak za swójske projekty wužiwać?
          </Typography>
          <Typography>
            Namakaće projekt bamborak tež na Github pod linkom xyz. Tam so potom
            wšitko dalše wopisuje.
          </Typography>
          <Typography level="h2">Čehodla sym bamborak stworił?</Typography>
          <Typography>
            Prjedy bamboraka dawaše jenož jedyn TTS-system za hornjoserbšćinu -
            a to bě plapadu wot Edwarda Wornarja. System pak lědma zrozumiš.
            Tohodla sym swójski system stworił, a to z wuspěchom. Poskajće raz
            sami.
          </Typography>
          <Typography>
            Plapadu - Prof. Dr. Eduard Werner (institut za sorabistiku):
          </Typography>
          <audio controls>
            <source src={plapadu} />
          </audio>
          <Typography>Bamborak - Korla Baier (14 lět stary):</Typography>
          <audio controls>
            <source src={bamborak} />
          </audio>
          <Typography level="h2">Kak funguje bamborak?</Typography>
          <Typography>
            Bamborak funguje na basy neuronalnej syći. To rěka zo sym dyrbjał
            tysacore sady nahrawać. Z tutymi sadami sym potom model picował. Na
            kóncu maš potom model z kotrymž móžeš sebi kóždu serbsku sadu
            předčitać dać - a to potom tež zrozumić.
          </Typography>
          <Typography level="h2">Dalše informacije:</Typography>
          <Typography>
            rěčnik - Korla Baier; trening - Korla Baier; techniske přesadźenje -
            Korla Baier
          </Typography>
        </Stack>
      </Box>
    </CssVarsProvider>
  );
}

export default App;
