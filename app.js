var Couchbase = require("couchbase");
var Express = require("express");
var UUID = require("uuid");
var BodyParser = require("body-parser");
var BCrypt = require("bcryptjs");

var app = Express();
var N1qlQuery = Couchbase.N1qlQuery;

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));

var cluster = new Couchbase.Cluster("couchbase://127.0.0.1");
// For Couchbase > 4.5 with RBAC Auth
cluster.authenticate('gbisimwa', 'changeme')
var bucket = cluster.openBucket("BOMOKO_DATA");

var validate = function(request, response, next){
    var authHeader = request.headers["authorization"];
    if(authHeader){
        bomokoToken = authHeader.split(" ");
        if(bomokoToken.length == 2){
            bucket.get(bomokoToken[1], (error, result) => {
                if(error){
                    return response.status(500).send(error);
                }
                request.pid = result.value.pid;
                bucket.touch(bomokoToken[1], 3600, (error, result)=>{});
                next();
            });
        } else {
            return response.status(401).send({ "message": "Bomoko Token is malformed"});
        }
    } else {
        return response.status(401).send({ "message": "An authorization header is required"});
    }
}

app.post("/register_client", (request, response) => {
    if(!request.body.phone){
        return response.status(401).send({ "message": "Veiller completer le numero de telephone"});
    } else if(!request.body.password){
        return response.status(401).send({ "message": "Veiller completer le mots de passe"});
    }
    var id = UUID.v4();
    var account = {
        "type": "account",
        "pid": id,
        "phone": request.body.phone,
        "password": BCrypt.hashSync(request.body.password, 10)
    }
    
    var profile = request.body;
    profile.type = "profile";

    delete profile.phone;
    delete profile.password;
    bucket.insert(id, profile, (error, result) => {
        if(error){
            return response.status(500).send(error);
        }
        bucket.insert(account.phone, account, (error, result) => {
            if(error){
                bucket.remove(id);
                return response.status(500).send(error);
            }
            response.send(result);
        });
    });
});

app.post("/login", (request, response) => {
    if(!request.body.phone){
        return response.status(401).send({ "message": "Veiller completer le numero de telephone"});
    } else if(!request.body.password){
        return response.status(401).send({ "message": "Veiller completer le mots de passe"});
    }
    bucket.get(request.body.phone, (error, result) => {
        if(error){
            return response.status(500).send(error);
        }
        if(!BCrypt.compareSync(request.body.password, result.value.password)){
            return response.status(401).send({ "message": "Le mots de passe est invalide"});
        }
        var id = UUID.v4();
        var session = {
            "type": "session",
            "pid": result.value.pid
        }
        bucket.insert(id, session, {"expiry":3600}, (error, result) => {
            if(error){
                return response.status(500).send(error);
            }
            response.send({"sid": id});
        });
    });
});

// app.post("/group", (request, response) => {

// });

// app.get("/groups", (request, response) => {

// });

var server = app.listen(3000, () =>{
    console.log("Listening on port " + server.address().port + "...");
});

