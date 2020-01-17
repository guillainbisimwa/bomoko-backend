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
//var bucket = cluster.openBucket("travel-sample", "");
// For Couchbase > 4.5 with RBAC Auth
cluster.authenticate('gbisimwa', 'changeme')
//var bucket = cluster.openBucket('default');
var bucket = cluster.openBucket("BOMOKO_DATA");



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
    /**
     * "username": "gbisimwa",
     * "password": "123",
     * "nom": "Guillain",
     * "phone": "+24312345678",
     * "sexe": "M",
     * "address": "Goma"
     */
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



// app.post("/group", (request, response) => {

// });

// app.get("/groups", (request, response) => {

// });

var server = app.listen(3000, () =>{
    console.log("Listening on port " + server.address().port + "...");
});
