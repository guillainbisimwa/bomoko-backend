
### Run couchbase
sudo docker run -d --name db -p 8091-8096:8091-8096 -p 11210-11211:11210-11211 36248dbc0a28

docker logs db
http://localhost:8091