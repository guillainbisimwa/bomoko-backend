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
    var code_conf_sms = Math.floor(Math.random() * 9999) + 1000;
    var account = {
        "pid": id,
        "phone": request.body.phone,
        "id_g" : "",
        "code_conf_sms" : "",
        "type": "account",
        "date_creation": (new Date()).getTime(),
        "etat": 0, // 0: En attente, 1: Valide, 2: Rejette
        "password": BCrypt.hashSync(request.body.password, 10)
    }
    
    var profile = request.body;
    profile.type = "profile";
    profile.code_conf_sms = code_conf_sms;

    delete profile.password;
    
    bucket.insert(id, profile, (error, result) => {
        if(error){
            return response.status(500).send(error);
        }
        bucket.insert(account.phone, account, (error, result) => {
            if(error){
                bucket.remove(id, (error, result) => {
                    return response.status(500).send(error);
                });
                return response.status(500).send(error);
            }
            //response.send(result);
            response.send({"code_conf_sms": code_conf_sms});
        });
    });
});

app.post("/login_conf_sms", (request, response) => {
    if(!request.body.code){
        return response.status(401).send({ "message": "Veiller completer le code SMS recu"});
    } else if(!request.body.sid){
        return response.status(401).send({ "message": "Aucune session ouverte"});
    }
    bucket.get(request.body.sid, function(error, result) {
        if (error) {
            return response.status(401).send({ "message": "Aucune session ouverte"});
        } else {
            if(result.value.code_conf_sms == request.body.code){
                //response.send(result.value); 
                result.value.etat = 1; //{"expiry":3600}
                bucket.replace(request.body.sid, result.value, {cas: result.cas}, function(error, result) {
                    if (error) {
                        return response.status(500).send(error);
                    }
                    //successfully confirmed 
                    response.send({"conf-sid":request.body.sid});
                });
            } else {
                return response.status(401).send({ "message": "Code errone"});
            }  
        }
    });
});

app.post("/valider_creation_cmpt", (request, response) => {
    if(!request.body.code){
        return response.status(401).send({ "message": "Veiller completer le code SMS recu"});
    } else if(!request.body.pid){
        return response.status(401).send({ "message": "Cet utilisateur n'existe pas"});
    }
    bucket.get(request.body.pid, function(error, result) {
        if (error) {
            return response.status(401).send({ "message": "Cet utilisateur n'existe pas"});
        } else {
            if(result.value.code_conf_sms == request.body.code){
                bucket.get(result.value.phone, function(error_, result_) {
                    if (error_) {
                        return response.status(401).send({ "message": "Cet compte n'a pas encore ete cree"});
                    } else {
                        result_.value.etat = 1;
                        result_.value.code_conf_sms = request.body.code; //{"expiry":3600}
                        bucket.replace(result_.value.phone, result_.value, {cas: result_.cas}, function(error__, result__) {
                            if (error__) {
                                return response.status(500).send(error__);
                            }
                            //successfully confirmed  account
                            response.send({"conf-pid":request.body.pid});
                        });
                    }
                });
            } else {
                return response.status(401).send({ "message": "Code errone"});
            }  
        }
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
        var code_conf_sms = Math.floor(Math.random() * 9999) + 1000;
        var session = {
            "type": "session",
            "pid": result.value.pid,
            "code_conf_sms":code_conf_sms,
            "etat":0
        }
        bucket.insert(id, session, {"expiry": 3600}, (error, result) => {
            if(error){
                return response.status(500).send(error);
            }
            response.send({"sid": id, "code_conf_sms":code_conf_sms});
        });
    });
});

app.post("/group", (request, response) => {
    if(!request.body.nom_group){
        return response.status(401).send({ "message": "Veiller completer le nom du groupe"});
    } else if(!request.body.details){
        return response.status(401).send({ "message": "Veiller completer le detail du groupe"});
    }
    var group = {
        "type": "group",
        "pid":request.pid,
        "nom_group": request.body.nom_group,
        "id_responsable": request.body.id_responsable,
        "details": request.body.details,
        "date_debut": request.body.date_debut,
        "date_fin": request.body.date_fin,
        "date_creation": (new Date()).getTime(),
        "etat": 0
    }
    bucket.insert(UUID.v4(), group, (error, result) => {
        if(error){
            return response.status(500).send(error);
        }
        response.send(group);
    });
});

app.post("/devenir_mbr_group", (request, response) => {
    if(!request.body.pid){
        return response.status(401).send({ "message": "Veillez vous identifier"});
    } else if(!request.body.id_g){
        return response.status(401).send({ "message": "Veillez selectionner un groupe"});
    }
    bucket.get(request.body.pid, function(error, result) {
        if (error) {
            return response.status(401).send({ "message": "Aucun utilisateur trouve"});
        } else {
            if(result.value.id_g == ""){
                //response.send(result.value); 
                result.value.id_g = request.body.id_g; //{"expiry":3600}
                bucket.replace(request.body.pid, result.value, {cas: result.cas}, function(error, result) {
                    if (error) {
                        return response.status(500).send(error);
                    }
                    //successfully confirmed 
                    response.send({"pid":request.body.pid , "id_g":request.body.id_g});
                });
            } else {
                return response.status(401).send({ "message": "Vous appartenez deja a un groupe"});
            }  
        }
    });
});

app.post("/quitter_un_group", (request, response) => {
    if(!request.body.pid){
        return response.status(401).send({ "message": "Veillez vous identifier"});
    }
    bucket.get(request.body.pid, function(error, result) {
        if (error) {
            return response.status(401).send({ "message": "Aucun utilisateur trouve"});
        } else {
            if(result.value.id_g != ""){
                //response.send(result.value); 
                result.value.id_g = ""; //{"expiry":3600}
                bucket.replace(request.body.pid, result.value, {cas: result.cas}, function(error, result) {
                    if (error) {
                        return response.status(500).send(error);
                    }
                    //successfully confirmed 
                    response.send({"pid":request.body.pid});
                });
            } else {
                return response.status(401).send({ "message": "Vous n'appartenez a aucun groupe"});
            }  
        }
    });
});

app.post("/credit", (request, response) => {
    if(!request.body.id_g){
        return response.status(401).send({ "message": "Veiller completer le nom du groupe"});
    } else if(!request.body.id_demandeur){
        return response.status(401).send({ "message": "Veiller completer le demandeur"});
    }
    var credit = {
        "type": "credit",
        "id_g": request.body.id_g,
        "id_demandeur": request.body.id_demandeur,
        "date_creation": (new Date()).getTime(),
        "somme": request.body.somme,
        "cat": request.body.cat,
        "etat": "0",
        "id_echeance":"",
        "saison": (new Date()).getTime()
    }
    bucket.insert(UUID.v4(), credit, (error, result) => {
        if(error){
            return response.status(500).send(error);
        }
        response.send(credit);
    });
});

// app.post("/request_credit", (request, response) =>{
//     if(!request.body.id_demandeur){
//         return response.status(401).send({ "message": "Veiller completer le nom du demandeur"});
//     } else if(!request.pid){
//         return response.status(401).send({ "message": "Veiller completer le demandeur"});
//     }else if(!request.somme_demand){
//         return response.status(401).send({ "message": "Veiller completer la somme_demand"});
//     }
//     var request_credit = {
//         "type": "request_credit",
//         "pid":request.pid,
//         "id_demandeur": request.body.id_demandeur,
//         "somme_demand": request.body.somme_demand,
//         "id_c": request.body.id_c,
//         "date_creation": (new Date()).getDate(),
//         "status": "0"    
//     }
//     bucket.insert(UUID.v4(), request_credit, (error, result) => {
//         if(error){
//             return response.status(500).send(error);
//         }
//         response.send(request_credit);
//         // TODO Create automatically echeance
//         // TODO Create automatically payments
//     });
// });

app.post("/valider_request_credit", (request, response) =>{
    if(!request.body.id_c){
        return response.status(401).send({ "message": "Vous n'avez pas de credit"});
    } else if(!request.body.intrt){
        return response.status(401).send({ "message": "Veiller completer l'interet"});
    }

    bucket.get(request.body.id_c, function(error, result) {
        if (error) {
            return response.status(401).send({ "message": "Vous n'avez pas de credit"});
        } else {

            //valider credit et creer echeance
            if(result.value.etat <= 0){//== 1
                return response.status(401).send({ "message": "Votre credit est dja valide"});
            }else {
                bucket.get(result.value.id_g, function(error_g, result_g) {
                    if (error_g) {
                        return response.status(401).send({ "message": "Vous n'avez pas de groupe"});
                    } else {
                        var id_echeance = UUID.v4();
                        result.value.etat = 1;
                        result.value.id_echeance = id_echeance;
                        bucket.replace(request.body.id_c, result.value, {cas: result.cas}, function(error_, result_) {
                            if (error_) {
                                return response.status(500).send(error_);
                            }
                            //console.log(result.value)
                            // successfully confirmed 
                            // Generate Echeance documents
                            // TODO df = Difference DATE DEBUT et DATE FIN. / CAT 
                            // To set two dates to two variables 
                            //1577854800000 : new Date("01/01/2020"); 
                            //1583125200000 : new Date("03/02/2020"); 
                            
                            var somme = parseFloat(result.value.somme);
                            var cat = parseFloat(result.value.cat);
                            var interet = parseFloat(request.body.intrt);
                            var days = (result_g.value.date_fin - result_g.value.date_debut) / (1000 * 3600 * 24);
                            var nbr_jr = Math.round(days/cat);
                            
                            var somme_echeance_single = somme / nbr_jr;
                            var interet_echeance_tot =  (somme * interet)/100;
                            var interet_echeance_single = interet_echeance_tot / nbr_jr;
                            var echeance = [];

                            date_ech = parseFloat(result_g.value.date_debut);
                            
                            for(i = 0; i < nbr_jr; i++){
                                date_ech = date_ech + cat;
                                id_c = request.body.id_c;
                                etat = 0;

                                somme_intert = somme_echeance_single + interet_echeance_single;

                                echeance.push({
                                    id: i,
                                    date_ech: date_ech,
                                    //id_c: id_c,
                                    etat: etat,
                                    somme_intert: somme_intert,
                                    somme_sans_inter: somme_echeance_single,
                                    inter: interet_echeance_single,
                                });
                            }
                            
                            var echeance_obj = { ...echeance }

                            bucket.insert(id_echeance, echeance_obj, (error_e, result) => {
                                if(error_e){
                                    return response.status(500).send(error_e);
                                }
                                response.send(echeance_obj);
                                //console.log({"echeance":echeance_obj});
                            });
                        });
                    }
                });
            }      
        }
    });
});
/** 
 * GET methods
 * 
 **/
app.get("/group", (request, response) => {
    var query = N1qlQuery.fromString("SELECT "+bucket._name+".* FROM "+bucket._name+" WHERE type = 'group' AND pid=$id");
    bucket.query(query, { "id": request.pid}, (error, result)=>{
        if(error){
            return response.status(500).send(error);
        }
        response.send(result);
    })
});

app.get("/groups", (request, response) => {
    var query = N1qlQuery.fromString("SELECT "+bucket._name+".* FROM "+bucket._name+" WHERE type = 'group'");
    bucket.query(query, (error, result)=>{
        if(error){
            return response.status(500).send(error);
        }
        response.send(result);
    })
});

var server = app.listen(3000, () =>{
    console.log("Listening on port " + server.address().port + " ...");
});

