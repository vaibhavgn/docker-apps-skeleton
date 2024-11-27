# Docker apps Skeleton


 This repo contains a sample docker environment setup where two spring boot services interact with each other

### Prerequisites
You need to have docker running on your laptop and install Maven

### Instructions to run

cd ./public.api
mvn clean install

cd ./retriever.svc
mvn clean install

docker compose up --build


### To stop and clean up environment

docker compose down


### Endpoints
#### Retriever
GET /data : returns a sample string  
GET / : hello message  

#### API server
GET /retriever : hits the retiever api endpoint and returns that message  
GET / : hello message  

