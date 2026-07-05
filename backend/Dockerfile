FROM python:3.11-slim-bookworm

WORKDIR /usr/app/src

RUN apt-get update -y
RUN apt-get install libsndfile1 -y
RUN apt-get install sox -y
RUN apt-get install libsox-fmt-all -y
RUN apt-get install build-essential -y
RUN apt-get install ffmpeg -y

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

RUN pip install -U pip
RUN pip install flask
RUN pip install flask-cors
RUN pip install setuptools_rust
RUN pip install "coqui-tts[codec]"
RUN pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install "transformers==5.0.0"

RUN mkdir temp
RUN mkdir logs

COPY ./ /usr/app/src/

EXPOSE 8080
RUN chmod u+x start.sh

CMD ["./start.sh", "logs"]