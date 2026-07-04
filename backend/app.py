use_tts = True

import flask
from flask import request, jsonify
from flask_cors import CORS, cross_origin
import os
import subprocess
import json

if use_tts:
    from TTS.api import TTS
import time
from utils import preprocess_text, split_into_sentences
import random
import numpy as np
import logging
import sys
from logging.handlers import RotatingFileHandler

logger = None


def init_logging(logdir):
    global logger
    # create logger
    logger = logging.getLogger("log_bamborak")
    logger.propagate = False

    # Avoid duplicate logs if init_logging is called multiple times.
    if logger.handlers:
        logger.handlers.clear()

    # set logging level
    logger.setLevel(logging.DEBUG)

    # create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    stream_handler = logging.StreamHandler(stream=sys.stdout)
    stream_handler.setLevel(logging.DEBUG)
    stream_handler.setFormatter(formatter)
    # create rotating file handler and set level to debug

    rot_handler = RotatingFileHandler(
        logdir + "/bamborak.log", maxBytes=20000000, backupCount=10
    )
    rot_handler.setLevel(logging.DEBUG)
    rot_handler.setFormatter(formatter)

    logger.addHandler(stream_handler)
    logger.addHandler(rot_handler)

    logger.debug("logging initialized")


MODEL_DIR = "tts_models"

LIMIT_CHARS = 10_000

app = None
speaker_config = {}
synthesizers = {}


app = flask.Flask(__name__)
CORS(app)


def init_config():
    global speaker_config
    global names
    with open("./config.json") as f:
        speaker_config = json.load(f)
        logger.debug("speaker_config " + str(speaker_config))
    with open("./names.json") as f:
        names = json.load(f)
        logger.debug("names " + str(names))


def init_synthesizers():
    for speaker in list(speaker_config.items()):
        if use_tts:
            cur_model_path = f"{MODEL_DIR}/{speaker[1]['model']}"
            cur_config_path = f"{MODEL_DIR}/{speaker[1]['config']}"
            logger.debug(
                "init_synthesizers: "
                + str(speaker[0])
                + " config_path: "
                + cur_config_path
                + " model_path: "
                + cur_model_path
            )
            logger.debug("init_synthesizers ...: " + str(speaker[1]))
            synthesizers[speaker[0]] = {
                "tts": TTS(
                    model_path=cur_model_path,
                    config_path=cur_config_path,
                )
            }
            if speaker[1]["multi_speaker"]:
                synthesizers[speaker[0]]["speakers"] = synthesizers[speaker[0]][
                    "tts"
                ].speakers

            # synthesizers[speaker[0]]["tts"].is_multi_lingual = False


def float32_to_mp3(data: np.ndarray, sample_rate: int, channels: int = 1):

    process = subprocess.Popen(
        [
            "ffmpeg",
            "-f", "f32le",                # raw float32 input
            "-ar", str(sample_rate),     # sample rate
            "-ac", str(channels),        # channels
            "-i", "pipe:0",
            "-f", "mp3",
            "-acodec", "libmp3lame",
            "-q:a", "2",
            "pipe:1"
        ],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    mp3_bytes, stderr = process.communicate(data.astype(np.float32).tobytes())
    if process.returncode != 0:
        ffmpeg_err = stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"ffmpeg conversion failed: {ffmpeg_err}")

    return mp3_bytes

@app.route("/api/info/", methods=["GET"])
def info():
    logger.debug(str(request))
    res = {"version": "0.0.4", "model": speaker_config}
    return res


@app.route("/api/fetch_speakers/", methods=["GET"])
def fetch_speakers():
    logger.debug(str(request))
    speakers = []
    for speaker in list(speaker_config.items()):
        if speaker[1]["multi_speaker"]:
            for idx, sub_speaker in enumerate(synthesizers[speaker[0]]["speakers"]):
                default_name = f"{speaker[1]['speaker']} {idx}"
                name = (
                    names.get(speaker[0], {}).get(str(idx), default_name)
                    if isinstance(names, dict)
                    else default_name
                )
                speakers.append(
                    {
                        "name": name,
                        "id": f"{speaker[1]['speaker_id']}/{sub_speaker}",
                        "info": speaker[1]["info"],
                    }
                )
        else:
            speakers.append(
                {
                    "name": speaker[1]["speaker"],
                    "id": speaker[1]["speaker_id"],
                    "info": speaker[1]["info"],
                }
            )
    return jsonify(speakers)


def err_msg(msg):
    logger.debug("errmsg " + str(msg))
    return {"errmsg": msg}, 400


def parse_tts_payload(payload):
    if not isinstance(payload, dict):
        return None, None, None, None, err_msg("invalid json payload")

    if "text" not in payload:
        return None, None, None, None, err_msg("missing text")
    if "speaker_id" not in payload:
        return None, None, None, None, err_msg("missing speaker_id")

    try:
        speaker_id, sub_speaker = payload["speaker_id"].split("/")
        multi_speaker = True
        if speaker_id not in speaker_config:
            return None, None, None, None, err_msg("invalid speaker_id")
        if sub_speaker not in synthesizers[speaker_id]["speakers"]:
            return None, None, None, None, err_msg("invalid speaker_id")
    except ValueError:
        speaker_id = payload["speaker_id"]
        sub_speaker = None
        multi_speaker = False
        if speaker_id not in speaker_config:
            return None, None, None, None, err_msg("invalid speaker_id")

    text = str(payload["text"]).strip()
    if LIMIT_CHARS > 0 and len(text) > LIMIT_CHARS:
        return None, None, None, None, err_msg(
            f"input text too long (max {LIMIT_CHARS} characters)"
        )
    if text == "":
        return None, None, None, None, err_msg("input text is empty")

    return text, speaker_id, sub_speaker, multi_speaker, None


def tts_wav(cur_tts, text, multi_speaker=False, sub_speaker=None):
    if multi_speaker:
        return cur_tts.tts(text=text, speaker=sub_speaker)

    try:
        return cur_tts.tts(text=text)
    except ValueError:
        return cur_tts.tts(text=text, speaker=random.choice(cur_tts.speakers))


def synthesize_sentence_mp3(text, speaker_id, multi_speaker=False, sub_speaker=None):
    normalized = preprocess_text(text, lower=speaker_config[speaker_id]["lower"])
    if normalized.strip() == "":
        return None

    cur_tts = synthesizers[speaker_id]["tts"]
    wav = tts_wav(
        cur_tts,
        normalized,
        multi_speaker=multi_speaker,
        sub_speaker=sub_speaker,
    )
    return float32_to_mp3(np.array(wav), 22050)


@app.route("/api/tts/", methods=["POST"])
def main():
    t1 = time.time()
    logger.debug(str(request))
    logger.debug("request json payload: " + str(request.json))

    try:
        payload = request.get_json(silent=True)
        text, speaker_id, sub_speaker, multi_speaker, payload_err = parse_tts_payload(
            payload
        )
        if payload_err is not None:
            return payload_err

        res_text = preprocess_text(text, lower=speaker_config[speaker_id]["lower"])
        logger.debug(">> calling synthesizer for '" + str(res_text) + "'")
        cur_tts = synthesizers[speaker_id]["tts"]
        wav = tts_wav(
            cur_tts,
            res_text,
            multi_speaker=multi_speaker,
            sub_speaker=sub_speaker,
        )
        t2 = time.time()
        rtf = (len(wav) / 22050) / (t2 - t1)
        logger.debug(f"tts synthesis took {t2-t1:.2f} seconds, RTF: {rtf:.2f}")
        mp3 = float32_to_mp3(np.array(wav), 22050)
        return flask.Response(mp3, mimetype="audio/mpeg")

    except Exception:
        logger.exception("Unhandled exception during /api/tts processing")
        return {"errmsg": "internal server error"}, 500


@app.route("/api/tts_stream/", methods=["POST"])
def tts_stream():
    t1 = time.time()
    logger.debug(str(request))
    logger.debug("request json payload: " + str(request.json))

    payload = request.get_json(silent=True)
    text, speaker_id, sub_speaker, multi_speaker, payload_err = parse_tts_payload(
        payload
    )
    if payload_err is not None:
        return payload_err

    sentences = split_into_sentences(text)
    if not sentences:
        return err_msg("input text is empty")

    logger.debug(f"streaming tts for {len(sentences)} sentence(s)")

    def generate_audio_chunks():
        first_audio_sent = False
        for idx, sentence in enumerate(sentences):
            mp3_chunk = synthesize_sentence_mp3(
                sentence,
                speaker_id,
                multi_speaker=multi_speaker,
                sub_speaker=sub_speaker,
            )
            if mp3_chunk is None:
                continue

            if not first_audio_sent:
                ttfa = time.time() - t1
                logger.debug(f"ttfa: {ttfa:.2f} seconds")
                first_audio_sent = True

            logger.debug(
                f"stream chunk {idx + 1}/{len(sentences)} size={len(mp3_chunk)} bytes"
            )
            yield mp3_chunk

    return flask.Response(generate_audio_chunks(), mimetype="audio/mpeg")


if __name__ == "__main__":
    logdir = "."
    if len(sys.argv) == 2:
        logdir = sys.argv[1]
    elif len(sys.argv) > 2:
        print("invalid arguments: " + str(sys.argv))
        exit(1)

    print("logdir is " + logdir)

    init_logging(logdir)
    init_config()
    init_synthesizers()

    logger.debug("starting webserver ...")
    app.run(port=int(os.environ.get("PORT", 8080)), host="0.0.0.0", debug=False)
    logger.debug("exiting ...")
