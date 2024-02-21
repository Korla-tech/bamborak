FROM python:3.10-buster

WORKDIR /usr/app/src

RUN pip install flask
RUN pip install flask-cors
RUN pip install -U TTS

RUN mkdir temp


COPY ./ /usr/app/src/

EXPOSE 8080
RUN chmod u+x start.sh

RUN apt update -y
RUN apt-get install libsndfile1 -y
RUN apt install sox -y
RUN apt install libsox-fmt-all -y

# q&d for a problem in the TTS package
COPY site-packages-TTS/api.py /usr/local/lib/python3.10/site-packages/TTS/api.py


CMD ["./start.sh", "logs"]