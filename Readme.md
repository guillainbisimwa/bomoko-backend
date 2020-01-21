# BOMOKO BACKEND Couchbase Node.js Client

This backend allows you to connect to a Couchbase cluster from 
Node.js.

## Run this Node js

To execute , run `npm start` from the root directory.

## Couchbase Documentation

An extensive documentation is available on the Couchbase website.  Visit our
[Node.js Community](http://couchbase.com/communities/nodejs) on
the [Couchbase](http://couchbase.com) website for the documentation as well as
numerous examples and samples.

### Run couchbase
## For the first time
`sudo docker run -d --name db -p 8091-8096:8091-8096 -p 11210-11211:11210-11211 36248dbc0a28`

## For the other times, 
Look for the container and start it
`sudo docker start 6d045d0c9a80`

`docker logs db`
`http://localhost:8091`

## Exemple of post::register_client

{
    "nom":"Ousmane Dembe;e",
    "phone":"+2432",
    "id_g" :"",
    "num_carte_elec" :"",
    "address" :"Bukavu, Nguba",
    "sexe" :"M",
    "profession" :"Entreneur",
    "code_conf_sms" :"",
    "password":"+2432"
}

## Exemple of post::register_client
{
    "nom_group": "GOMA UNITY",
    "id_responsable": "",
    "details": "Groupe de volontaires vendeuse de SAMAKI",
    "date_debut": "1579514817538",
    "date_fin": "1579514817538"
}

## Exemple of post::credit ("type": 30 #mensuel : 30, hebdo: 7)
{
    "id_g":"",
    "id_demandeur":"",
    "somme":"150",
    "cat": 30 #mensuel : 30, hebdo: 7
}

## Exemple of post::echeance
{
    "id_c":"",
    "somme":"150",
    "somme_intrt":"152",
    "date_remise":"1579514817538",
    "num_order":1
}