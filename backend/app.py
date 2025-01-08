use_tts = True

import flask
from flask import request, jsonify, send_file
from flask_cors import CORS
import os
import subprocess
import json

if use_tts:
    from TTS.api import TTS
import uuid
import threading
import time
from utils import number_to_text, year_to_text
import subprocess
import random
import re


import logging
import sys
from logging.handlers import RotatingFileHandler

logger = None


def init_logging(logdir):
    global logger
    # create logger
    logger = logging.getLogger("log_bamborak")

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


synthesizers = {}

MODEL_DIR = "tts_models"

LIMIT_CHARS = 10_000

app = None
speaker_config = {}
synthesizers = {}


app = flask.Flask(__name__)


# CORS
def init_app():
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


def init_synthesiszers():
    for speaker in list(speaker_config.items()):
        if use_tts:
            cur_model_path = f"{MODEL_DIR}/{speaker[1]['model']}"
            cur_config_path = f"{MODEL_DIR}/{speaker[1]['config']}"
            logger.debug(
                "init_synthesiszers: "
                + str(speaker[0])
                + " config_path: "
                + cur_config_path
                + " model_path: "
                + cur_model_path
            )
            logger.debug("init_synthesiszers ...: " + str(speaker[1]))
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


char_to_spoken = {
    "a": "a",
    "b": "bej",
    "c": "cej",
    "će": "ćej",
    "č": "čet",
    "d": "dej",
    "e": "e",
    "f": "ef",
    "g": "gej",
    "h": "ha",
    "i": "i",
    "j": "jot",
    "k": "ka",
    "l": "el",
    "ł": "eł",
    "m": "em",
    "n": "en",
    "ń": "ejn",
    "o": "o",
    "ó": "ót",
    "p": "pej",
    "r": "er",
    "ř": "eř",
    "s": "es",
    "š": "eš",
    "t": "tej",
    "u": "u",
    "w": "w",
    "v": "fau",
    "x": "iks",
    "y": "ypsilon",
    "z": "zet",
    "ž": "žet",
    " ": "",
}


def is_number(s):
    try:
        int(s)
        return True
    except ValueError:
        return False


def delete_temp_files(file0, file1):
    # 120 Sekunden warten, bis dahin sollte das Datei versendet worden sein ....
    time.sleep(120)
    #   exec(f"ls -l temp")
    exec(f"rm {file0}")
    exec(f"rm {file1}")


def exec(cmd):
    logger.debug(f">>> exec {cmd}")
    subprocess.run(cmd, shell=True, check=True)
    logger.debug(f"<<< exec")


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
                if speaker[0] in names:
                    if str(idx) in names[speaker[0]]:
                        speakers.append(
                            {
                                "name": f"{names[speaker[0]][str(idx)]}",
                                "id": f"{speaker[1]['speaker_id']}/{sub_speaker}",
                                "info": speaker[1]["info"],
                            }
                        )
                else:
                    speakers.append(
                        {
                            "name": f"{speaker[1]['speaker']} {idx}",
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
    return {"errmsg": msg}


@app.route("/api/tts/", methods=["POST"])
def main():
    logger.debug(str(request))
    logger.debug("request json payload: " + str(request.json))

    try:
        if "text" not in request.json:
            return err_msg("missing text")
        if "speaker_id" not in request.json:
            return err_msg("missing speaker_id")
        try:
            speaker_id, sub_speaker = request.json["speaker_id"].split("/")
            multi_speaker = True
            if speaker_id not in speaker_config:
                return err_msg("invalid speaker_id")
            if sub_speaker not in synthesizers[speaker_id]["speakers"]:
                return err_msg("invalid speaker_id")
        except ValueError:
            speaker_id = request.json["speaker_id"]
            multi_speaker = False
            if speaker_id not in speaker_config:
                return err_msg("invalid speaker_id")

        text = request.json["text"].strip()

        if LIMIT_CHARS > 0 and len(text) > LIMIT_CHARS:
            return err_msg(f"input text too long (max {LIMIT_CHARS} characters)")

        if text[-1] == "." or text[-1] == "," or text[-1] == "!" or text[-1] == "?":
            pass
        else:
            text = f"{text}."

        for match in re.findall(r"\b\d{4}-\d{2,4}\b", text):
            first_num, sec_num = match.split("-")
            first_num_txt = year_to_text(first_num)
            sec_num_txt = year_to_text(sec_num)
            text = text.replace(match, f"{first_num_txt} do {sec_num_txt}")

        for match in re.findall(r"\d{1,2}:\d{2}\s*hodź(?:\.|in)?", text):
            first_num, sec_num = match.split(":")
            sec_num = "".join(char for char in sec_num if char.isdigit())
            first_num_txt = number_to_text(first_num)
            if sec_num != "00":
                sec_num_txt = number_to_text(sec_num)
            else:
                sec_num_txt = ""
            text = text.replace(match, f"{first_num_txt} hodźin {sec_num_txt}")

        abbr_start = None
        num_start = None
        res_text = ""
        curstate = "char"
        laststate = ""
        for index in range(len(text)):
            char = text[index]
            # print(f".. {index} {char}")
            if char.isupper():
                if abbr_start is None:
                    abbr_start = index
                    curstate = "abbr"
                    # print(f"starting abbreviation at {index}")
            elif is_number(char):
                if num_start is None:
                    num_start = index
                    curstate = "num"
                    # print(f"starting number at {index}")
            else:
                curstate = "char"
            # print(f"{laststate} -> {curstate}")

            if curstate != laststate:
                if laststate == "abbr":
                    written_abbr = ""
                    abbr = text[abbr_start:index]
                    # print(f"found abbreviation {abbr}")
                    if len(abbr) > 1:
                        for letter in abbr:
                            written_abbr = (
                                f"{written_abbr} {char_to_spoken[letter.lower()]}"
                            )
                        res_text = res_text + " " + written_abbr + " "
                    else:
                        res_text = res_text + abbr
                    abbr_start = None
                elif laststate == "num":
                    num = text[num_start:index]
                    # print(f"found number {num}")
                    res_text = res_text + " " + number_to_text(num) + " "
                    num_start = None

            if curstate == "char":
                res_text = res_text + char
            # print(f"res_text: {res_text}")

            laststate = curstate

        if speaker_config[speaker_id]["lower"]:
            res_text = res_text.lower()
        res_text = res_text.replace("  ", " ")
        res_text = res_text.replace("\xad", "")
        res_text = res_text.replace("x", "ks")
        temp_wav_file_path = f"temp/{uuid.uuid4().hex}.wav"
        temp_mp3_file_path = f"temp/{uuid.uuid4().hex}.mp3"
        logger.debug(">> calling synthesizer for '" + str(res_text) + "'")
        cur_tts = synthesizers[speaker_id]["tts"]
        logger.debug("tts: " + str(list(cur_tts.__dict__.keys())))
        if multi_speaker:
            cur_tts.tts_to_file(
                text=res_text,
                file_path=temp_wav_file_path,
                speaker=sub_speaker,
            )
        else:
            try:
                cur_tts.tts_to_file(text=res_text, file_path=temp_wav_file_path)
            except ValueError:
                cur_tts.tts_to_file(
                    text=res_text,
                    file_path=temp_wav_file_path,
                    speaker=random.choice(cur_tts.speakers),
                )
        logger.debug("<< synthesizer called!")
        exec(f"sox {temp_wav_file_path} {temp_mp3_file_path}")
        delete_temp_file_thread = threading.Thread(
            target=delete_temp_files, args=(temp_mp3_file_path, temp_wav_file_path)
        )
        delete_temp_file_thread.start()
        return send_file(temp_mp3_file_path)

    except Exception as ex:
        trace = []
        tb = ex.__traceback__
        while tb is not None:
            trace.append(
                {
                    "filename": tb.tb_frame.f_code.co_filename,
                    "name": tb.tb_frame.f_code.co_name,
                    "lineno": tb.tb_lineno,
                }
            )
            tb = tb.tb_next
        ret = {
            "errmsg": "Exception",
            "exception": {
                "type": type(ex).__name__,
                "message": str(ex),
                "trace": trace,
            },
        }
        logger.debug("Exception: " + str(ret))
        return ret


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
    init_app()
    init_synthesiszers()

    logger.debug("starting webserver ...")
    app.run(port=int(os.environ.get("PORT", 8080)), host="0.0.0.0", debug=False)
    logger.debug("exiting ...")
