FROM python:3.10-buster

WORKDIR /usr/app/src

RUN apt update -y
RUN apt-get install libsndfile1 -y
RUN apt install sox -y
RUN apt install libsox-fmt-all -y

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

RUN pip install -U pip
RUN pip install flask
RUN pip install flask-cors
RUN pip install setuptools_rust
RUN git clone https://github.com/coqui-ai/TTS
RUN pip install -e TTS/

RUN mkdir temp
RUN mkdir logs

COPY ./ /usr/app/src/

EXPOSE 8080
RUN chmod u+x start.sh

RUN apt update -y
RUN apt-get install libsndfile1 -y
RUN apt install sox -y
RUN apt install libsox-fmt-all -y

CMD ["./start.sh", "logs"]