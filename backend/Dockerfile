FROM python:3.10-slim-buster

WORKDIR /usr/app/src

RUN pip install flask
RUN pip install flask-cors
RUN pip install TTS

RUN mkdir temp

COPY * /usr/app/src/

CMD ["./start.sh"]