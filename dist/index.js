'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _commune = require('./models/commune.js');

var _geometry = require('./models/geometry.js');

var _communedestination = require('./models/communedestination.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

var DepartmentIDF = ['75', '77', '78', '91', '92', '93', '94', '95'];
var googleApiKey = 'AIzaSyDxQd3N1q7go1dt5o_5_nK5FGKg_2cwApI';

app.use((0, _morgan2.default)('dev'));
app.use(_bodyParser2.default.json());

// setting and connecting our data base
_mongoose2.default.connect('mongodb://localhost:27017/distimetest', function (err) {
	if (err) {
		throw err;
	} else {
		console.log('the data base is connected');
	}
});

// getting communes list

var urlApiGouv = "https://geo.api.gouv.fr/departements/" + DepartmentIDF[0] + "/communes?fields=nom,code,codesPostaux,centre,surface,contour,codeDepartement,departement,codeRegion,region&format=geojson&geometry=centre";

// request(urlApiGouv, function (error, response, body) {

// 	if (error) console.log('error:', error);
// 	else {
// 		console.log('statusCode:', response && response.statusCode);
// 		let bodyjson = JSON.parse(body);
// 		let communesList = bodyjson.features;
// 		console.log('number of communes found:', communesList.length);
// 		// console.log('communesList: ', communesList);

// // 		//on parcourt le tableau communeList 
// 		//pour vérifier si certaines sont déjà dans la liste
// 		var i = '';
// 		for (i=0; i<communesList.length; i++){

// 			console.log('communesList[i]test1,', communesList[i]);

// 			//faire un findOne pour vérifier si une commune existe déjà dans la base de donnée.
// 			Commune.findOne({'name' : communesList[i].properties.nom}, function(err, result){
// 				console.log('communesList[i]',communesList[i] );
// 				if(err) console.log('findOne on Commune.name return error');
// 				if(result) console.log ('Toutes les communes sont déjà répertoriées dans la base de donnée');
// 				else {

// 					//le findOne n'a pas trouvé la commune dans la base de donnée,
// 					console.log('the commune' + communesList[i].properties.nom + 
// 						'is not yet in database, we should register it' );

// 					//on récupère les datas et on les enregistre sur la base de donnée.
// 					let commune = new Commune;
// 					commune.name = communesList[i].properties.nom;
// 					commune.codeCommune = communesList[i].properties.code;
// 					commune.department = communesList[i].properties.departement.nom;
// 					commune.codeDepartment = communesList[i].properties.codeDepartement;
// 					commune.region = communesList[i].properties.region.nom;
// 					commune.codeRegion = communesList[i].properties.codeRegion;
// 					commune.codesPostaux = communesList[i].properties.codesPostaux;
// 					commune.geometry.type = communesList[i].geometry.type;
// 					commune.geometry.coordinates = communesList[i].geometry.coordinates;

// 					//save commune in database
// 					commune.save((err) => {
// 						if(err){
// 							return err;
// 							console.log('commune could not be saved');
// 						}
// 						else {
// 							console.log('new commune saved:', commune);
// 						}
// 					});
// 				}
// 			});
// 		}
// 	}
// });


//getting Distance matrix with time per transportation mode


// Dans origins, coordonnées geographique de communes d'origine
// plusieurs lieux doivent être séparé par un | dans la requete
// test sur lieusaint
// let origins = [2.5537965214095197,48.63014717927843];
var origins = "Lieusaint";

// Dans destinations, coordonnées geographique de communes de destination
// test sur Meaux
// let destinations = [2.890786966077282,48.95793947650635];
var destinations = "Meaux";

var urlApiGoogle = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=' + origins + '&destinations=' + destinations + '&key=' + googleApiKey;

(0, _request2.default)(urlApiGoogle, function (error, response, body) {

	if (error) console.log('error:', error);else {
		console.log('statusCode:', response && response.statusCode);
		//need to convert the body "string" into JSON format
		var bodyJsonApiGoogle = JSON.parse(body);

		console.log('body after parsing: ', bodyJsonApiGoogle);
		console.log('bodyJsonApiGoogle.origin_addresses: ', bodyJsonApiGoogle.origin_addresses);
		console.log('bodyJsonApiGoogle.rows:', bodyJsonApiGoogle.rows[0]);

		//check if one origin is already in database
		_commune.Commune.find({ 'name': bodyJsonApiGoogle.origin_addresses }, function (err, result) {
			if (err) return err;
			//If YES on cree l'objet communeDestination 
			// que l'on savera dans la collection communes
			if (result) {
				console.log('result :', result);

				var communeDestination = new _communedestination.CommuneDestination();

				communeDestination.destination.geometry = bodyJsonApiGoogle.destination_addresses;
				communeDestination.distanceToDestination.distanceText = bodyJsonApiGoogle.rows[0].elements[0].distance.text;
				communeDestination.distanceToDestination.distanceValue = bodyJsonApiGoogle.rows[0].elements[0].distance.value;
				communeDestination.timeToDestination.modeDriving.timeText = bodyJsonApiGoogle.rows[0].elements[0].duration.text;
				communeDestination.timeToDestination.modeDriving.timeValue = bodyJsonApiGoogle.rows[0].elements[0].duration.value;

				console.log('commune including destination:', communeDestination);
			}
		});
	}
});

//launching our app
app.listen('8080', function () {
	console.log('app running and listening to port 8080');
});

//TO DO NEXT:
//save communedestination in commune
//solve the communesList[i] not found in the findOne
//solve the pb latitude & longitude as parameters.


//readme:
//- usage of 'request': new to me
//- how can i do a for in a findOne
//- difficulté à passer en parametre la latitude,longitude, 
//car google ne me renvoie pas les infos, pourtant la requete marche avec le nom de la commune.
//je préfère prendre le latitude, longitude au cas ou deux communes auraient le meme nom
//- GeoJSON: https://www.youtube.com/watch?v=MvY8vcrojYw
//practice ES6 Import / export / babel