import flask
from flask import request, jsonify, send_file

from flask_cors import CORS

import os

import json

from TTS.utils.synthesizer import Synthesizer

import uuid

import threading

import time

from utils import number_to_text

app = flask.Flask(__name__)

# CORS
CORS(app)

with open("./config.json") as f:
    speaker_config = json.load(f)

synthesizers = {

}

MODEL_DIR = "models"

LIMIT_CHARS = True

for speaker in list(speaker_config.items()):
    synthesizers[speaker[0]] = Synthesizer(
        tts_checkpoint=f"{MODEL_DIR}/{speaker[1]['model']}",
        tts_config_path=f"{MODEL_DIR}/{speaker[1]['config']}",
    )

char_to_spoken = {
    "a": "a",
    "b": "be",
    "c": "ce",
    "će": "će",
    "č": "čet",
    "d": "de",
    "e": "e",
    "f": "ef",
    "g": "ge",
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
    "p": "pe",
    "r": "er",
    "ř": "eř",
    "s": "es",
    "š": "eš",
    "t": "te",
    "u": "u",
    "w": "w",
    "v": "fau",
    "x": "iks",
    "y": "ypsilon",
    "z": "zet",
    "ž": "žet",
    " ": ""
}


def is_number(s):
    try:
        int(s)
        return True
    except ValueError:
        return False


def delete_temp_files(file0, file1):
    time.sleep(1)
    os.system(f"rm {file0}")
    os.system(f"rm {file1}")


@app.route("/api/fetch_speakers/", methods=["GET"])
def fetch_speakers():
    speakers = []
    for speaker in list(speaker_config.items()):
        speakers.append({
            "name": speaker[1]["speaker"],
            "id": speaker[1]["speaker_id"]
        })
    return jsonify(speakers)


@app.route("/api/tts/", methods=["POST"])
def main():
    if "text" not in request.json:
        return jsonify("žadyn tekst")
    if "speaker_id" not in request.json:
        return jsonify("žadyn rěćnik")
    if request.json["speaker_id"] not in speaker_config:
        return jsonify("wopačna speaker_id")

    text = request.json["text"]

    if len(text) > 700 and LIMIT_CHARS:
        return jsonify("twój tekst je dlěši hač 700 znamješkow")

    if text[-1] == "." or text[-1] == "," or text[-1] == "!":
        pass
    else:
        text = f"{text}."

    abbr_start = None
    num_start = None

    for index in range(len(text)):
        char = text[index]
        if char.isupper():
            if abbr_start is None:
                abbr_start = index
        else:
            if abbr_start is not None:
                written_abbr = ""
                abbr = text[abbr_start:index]
                if len(abbr) > 1:
                    for letter in abbr:
                        written_abbr = f"{written_abbr} {char_to_spoken[letter.lower()]}"
                    text = text.replace(
                        abbr, written_abbr.strip())
        if is_number(char):
            if num_start is None:
                num_start = index
            else:
                if num_start is not None:
                    num = text[num_start:index]
                    text = text.replace(num, number_to_text(num))
        abbr_start = None

    text = text.lower()

    wav = synthesizers[request.json["speaker_id"]].tts(text)
    temp_wav_file_path = f"temp/{uuid.uuid4().hex}.wav"
    temp_mp3_file_path = f"temp/{uuid.uuid4().hex}.mp3"
    synthesizers[request.json["speaker_id"]].save_wav(wav, temp_wav_file_path)
    os.system(
        f"ffmpeg -i {temp_wav_file_path} -af '{speaker_config[request.json['speaker_id']]['effects']}' {temp_mp3_file_path}")
    delete_temp_file_thread = threading.Thread(
        target=delete_temp_files, args=(temp_mp3_file_path, temp_wav_file_path))
    delete_temp_file_thread.start()
    return send_file(temp_mp3_file_path)


if __name__ == "__main__":
    app.run(port=int(os.environ.get('PORT', 8080)),
            host='0.0.0.0', debug=True)
