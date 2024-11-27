# crypto-dashboard


 This repo contains a sample docker environment setup where two spring boot services interact with each other

### Prerequisites
You need to have docker running on your laptop and install Maven

### To run:

cd ./public.api
mvn clean install

cd ./retriever.svc
mvn clean install

docker compose up --build


### To stop and clean up environment

docker compose down