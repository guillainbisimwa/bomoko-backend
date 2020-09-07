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
`sudo docker run -d --name db -p 8091-8096:8091-8096 -p 11210-11211:11210-11211 c98f53078b88`

## For the other times, 
Look for the container and start it
`sudo docker start 6d045d0c9a80`

`docker logs db`
`http://192.168.56.1:8091`

# To acces the host from emulator (genymotion)
look for the inet of vboxnet0
`inet 192.168.56.1`

vboxnet0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.56.1  netmask 255.255.255.0  broadcast 192.168.56.255
        inet6 fe80::800:27ff:fe00:0  prefixlen 64  scopeid 0x20<link>
        ether 0a:00:27:00:00:00  txqueuelen 1000  (Ethernet)
        RX packets 0  bytes 0 (0.0 B)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 150  bytes 27118 (26.4 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0


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

## Authors

👤 **Guillain Bisimwa**

- Github: [@guillainbisimwa](https://github.com/guillainbisimwa)
- Twitter: [@gullain_bisimwa](https://twitter.com/gullain_bisimwa)
- Linkedin: [linkedin](https://www.linkedin.com/in/guillain-bisimwa-8a8b7a7b/)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## Show your support

Give a ⭐️ if you like this project!
