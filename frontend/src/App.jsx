import {
  Download,
  Info,
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
  IconButton,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Tooltip,
  Typography,
} from "@mui/joy";

import Textarea from "@mui/joy/Textarea";
import { Stack } from "@mui/system";
import { useEffect, useRef, useState } from "react";

import { realtime_factor, url, max_textlen } from "./config.js";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speakers, setSpeakers] = useState([]);
  const [text, setText] = useState("");
  const [ID, setID] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoText, setInfoText] = useState("");

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
    if (text.length > max_textlen) {
      setOpen(true);
      setError("Zapodaj tekst z <= " + max_textlen + " znamješkami!");
      return;
    }
    setIsLoading(true);
    setProgress(0);
    setOpen(false);
    setEstimatedTime(((text.length / 11) * realtime_factor).toFixed());
    let estimated_time = ((text.length / 11) * realtime_factor).toFixed();
    console.log("est.time: " + estimatedTime);
    let elapsed_time = 0;
    let interval = setInterval(() => {
      elapsed_time++;
      setProgress((elapsed_time / estimated_time) * 100);
      console.log(
        "el.time vs. est.time: " +
          elapsed_time +
          " / " +
          estimated_time +
          " = " +
          (elapsed_time / estimated_time) * 100 +
          "%"
      );
    }, 1000);
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
        console.log("result blob (" + blob.type + "): ");
        console.log(blob);
        clearInterval(interval);
        setIsLoading(false);
        if (blob.type == "application/json") {
          // Dann ist es ein Fehlerobject .....
          var myReader = new FileReader();
          myReader.onload = function (event) {
            setOpen(true);
            //setError(JSON.stringify(myReader.result));
            setError("" + myReader.result);
            console.log("error: " + myReader.result);
          };
          myReader.readAsText(blob);
        } else {
          audio_blob.current = blob;
          let blobUrl = URL.createObjectURL(blob);
          audio.current = new Audio(blobUrl);
          audio.current.play();
          setIsLoaded(true);
          setIsPlaying(true);
        }
      });
    });
  };

  useEffect(() => {
    fetch(`${url}/api/fetch_speakers/`).then((response) =>
      response.json().then((data) => {
        setID(Object.values(data)[0].id);
        setInfoText(Object.values(data)[0].info);
        setSpeakers(data);
      })
    );
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
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
        <Typography level="h5" textAlign={"center"}>
          TTS-system za hornjoserbšćinu
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
          }}
        >
          <Select
            color="primary"
            placeholder="wuzwol sebi hłós"
            variant="soft"
            sx={{ flex: 1 }}
            value={ID}
            onChange={(e, values) => {
              setID(values);
              speakers.map((speaker) => {
                if (speaker.id === values) {
                  setInfoText(speaker.info);
                }
              });
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
          <Tooltip title={"informacije k rěčnikej"} sx={{ ml: 1 }}>
            <IconButton
              onClick={() => {
                setInfoOpen(true);
              }}
            >
              <Info />
            </IconButton>
          </Tooltip>
        </Box>
        <Modal open={infoOpen}>
          <ModalDialog color="primary" layout="center" size="sm" variant="soft">
            <ModalClose
              onClick={() => {
                setInfoOpen(false);
              }}
            />
            <Typography level="h5">Informacije k modelej</Typography>
            <Typography>{infoText}</Typography>
          </ModalDialog>
        </Modal>
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
            isLoading ? (
              <CircularProgress variant="soft" determinate value={progress} />
            ) : (
              <VolumeUp />
            )
          }
        >
          tekst sebi naposkać
        </Button>
        {isLoading ? (
          <Typography>trochowany čas: {estimatedTime}s</Typography>
        ) : null}
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
          Bamborak je TTS-system za hornjoserbšćinu. TTS je jendźelsce a stej za
          tekst k rěči. Bamborak je TTS-system na basy neuronalneje syće. Z
          neuronalnej syću móže bamborak přirodnu syntezu stworić.
        </Typography>
        <Typography level="h2">
          Kak móžu bamborak za swójske projekty wužiwać?
        </Typography>
        <Typography>
          Namakaće projekt bamborak tež na{" "}
          <a href="https://github.com/Korla-tech/bamborak">Github</a>. Tam so
          potom wšitko dalše wopisuje.
        </Typography>
        <Typography level="h2">Kak funguje bamborak?</Typography>
        <Typography>
          Bamborak funguje na basy neuronalneje syće. To rěka, zo sym dyrbjał
          tysacore sady nahrawać. Z tutymi sadami sym potom model picował. Na
          kóncu maš potom model z kotrymž móžeš sebi kóždu serbsku sadu
          předčitać dać - a to potom tež zrozumić.
        </Typography>
        <Typography>
          ✉️{" "}
          <a
            title="přez mejlowy program"
            href="mailto:bamborak@gaussia.de?subject=M%C3%B3j%20feedback%20za%20bamboraka"
          >
            kontakt/feedback
          </a>
        </Typography>
      </Stack>
    </Box>
  );
}

export default App;
