FROM python:3.10-buster

WORKDIR /usr/app/src

RUN pip install flask
RUN pip install flask-cors
RUN pip install TTS

RUN mkdir temp

COPY ./ /usr/app/src/
EXPOSE 8080
RUN chmod u+x start.sh

RUN apt update -y
RUN apt-get install libsndfile1 -y
RUN apt install ffmpeg -y

CMD ["./start.sh"]