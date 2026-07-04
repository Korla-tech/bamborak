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

  const audio_blob = useRef();
  const audioCtxRef = useRef(null);
  const decodedBuffersRef = useRef([]);

  const stopAudio = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    decodedBuffersRef.current = [];
  };

  const scheduleBuffers = (ctx, buffers, startTime) => {
    let t = startTime;
    for (const buf of buffers) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(t);
      t += buf.duration;
    }
    return t;
  };

  const readJsonError = async (response) => {
    const body = await response.text();
    try {
      const parsed = JSON.parse(body);
      return parsed.errmsg || body;
    } catch (error) {
      return body;
    }
  };

  const synthesize = async () => {
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

    stopAudio();
    setIsLoading(true);
    setIsLoaded(false);
    setIsPlaying(false);
    setProgress(0);
    setOpen(false);
    setEstimatedTime(((text.length / 11) / realtime_factor).toFixed());

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    decodedBuffersRef.current = [];

    let estimated_time = ((text.length / 11) / realtime_factor).toFixed();
    let elapsed_time = 0;
    let interval = setInterval(() => {
      elapsed_time++;
      setProgress((elapsed_time / estimated_time) * 100);
    }, 1000);

    let isFirstChunk = true;
    let nextTime = 0;
    const allChunks = [];

    try {
      const response = await fetch(`${url}/api/tts_stream/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          speaker_id: ID,
        }),
      });

      if (!response.ok) {
        const errText = await readJsonError(response);
        setOpen(true);
        setError("" + errText);
        return;
      }

      if (!response.body) {
        throw new Error("Streaming body not available");
      }

      const streamReader = response.body.getReader();

      while (true) {
        const { value, done } = await streamReader.read();
        if (done) break;

        allChunks.push(value);

        try {
          const copy = value.buffer.slice(
            value.byteOffset,
            value.byteOffset + value.byteLength
          );
          const audioBuffer = await ctx.decodeAudioData(copy);
          decodedBuffersRef.current.push(audioBuffer);

          if (isFirstChunk) {
            isFirstChunk = false;
            nextTime = ctx.currentTime + 0.1;
            clearInterval(interval);
            setIsLoading(false);
            setIsLoaded(true);
            setIsPlaying(true);
          }

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.start(nextTime);
          nextTime += audioBuffer.duration;
        } catch (decodeErr) {
          console.warn("Audio chunk decode failed:", decodeErr);
        }
      }

      if (allChunks.length > 0) {
        audio_blob.current = new Blob(allChunks, { type: "audio/mpeg" });
      }
      setProgress(100);

      const msRemaining = Math.max(0, nextTime - ctx.currentTime) * 1000;
      setTimeout(() => setIsPlaying(false), msRemaining);
    } catch (error) {
      console.error(error);
      setOpen(true);
      setError("Synteza njeje so poradźiła.");
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${url}/api/fetch_speakers/`).then((response) =>
      response.json().then((data) => {
        setID(Object.values(data)[0].id);
        setInfoText(Object.values(data)[0].info);
        setSpeakers(data);
      })
    );

    return () => {
      stopAudio();
    };
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
            <Typography>
              <article dangerouslySetInnerHTML={{ __html: infoText }} />
            </Typography>
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
                if (!audioCtxRef.current) return;
                if (isPlaying) {
                  audioCtxRef.current.suspend();
                  setIsPlaying(false);
                } else {
                  audioCtxRef.current.resume();
                  setIsPlaying(true);
                }
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </Button>
            <Button
              onClick={() => {
                if (decodedBuffersRef.current.length === 0) return;
                if (audioCtxRef.current) audioCtxRef.current.close();
                const ctx = new AudioContext();
                audioCtxRef.current = ctx;
                const endTime = scheduleBuffers(
                  ctx,
                  decodedBuffersRef.current,
                  ctx.currentTime + 0.1
                );
                setIsPlaying(true);
                const ms = Math.max(0, endTime - ctx.currentTime) * 1000;
                setTimeout(() => setIsPlaying(false), ms);
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
