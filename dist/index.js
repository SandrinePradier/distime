'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)(); //defining our variables

// setting and connecting our data base

_mongoose2.default.connect('mongodb://localhost:27017/distimetest', function (err) {
	if (err) {
		throw err;
	} else {
		console.log('the data base is connected');
	}
});

// creating Schema

var Schema = _mongoose2.default.Schema;

var communeSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	codeCommune: {
		type: String,
		required: true
	},
	department: {
		type: String,
		required: true
	},
	codeDepartment: {
		type: String,
		required: true
	},
	region: {
		type: String,
		required: true
	},
	codeRegion: {
		type: String,
		required: true
	},
	codesPostaux: {
		type: Array,
		required: true
	},
	geometry: {
		type: {
			type: String, required: true },
		coordinates: {
			type: Array, required: true }
	}
});

// creation of a model based on our communeSchema

var Commune = _mongoose2.default.model('commune', communeSchema);

// getting communes list

// let DepartmentIDF = [];
var url = "https://geo.api.gouv.fr/departements/77/communes?fields=nom,code,codesPostaux,centre,surface,contour,codeDepartement,departement,codeRegion,region&format=geojson&geometry=centre";

_request2.default.get(url, function (error, response, body) {
	var bodyjson = JSON.parse(body);
	// console.log('here is the response:', response);
	// console.log('here is the body:', bodyjson);
	// console.log('body:', bodyjson);
	console.log('body1st:', bodyjson.features[0]);

	var testCommune = new Commune();

	testCommune.name = bodyjson.features[0].properties.nom;
	testCommune.codeCommune = bodyjson.features[0].properties.code;
	testCommune.department = bodyjson.features[0].properties.departement.nom;
	testCommune.codeDepartment = bodyjson.features[0].properties.codeDepartement;
	testCommune.region = bodyjson.features[0].properties.region.nom;
	testCommune.codeRegion = bodyjson.features[0].properties.codeRegion;
	testCommune.codesPostaux = bodyjson.features[0].properties.codesPostaux;
	testCommune.geometry.type = bodyjson.features[0].geometry.type;
	testCommune.geometry.coordinates = bodyjson.features[0].geometry.coordinates;

	console.log('testCommune :', testCommune);

	testCommune.save(function (err) {
		if (err) {
			return err;
			console.log('testCommune could not be saved');
		} else {
			console.log('testCommune saved:', testCommune);
		}
	});
});

//launching our app

app.listen('8080', function () {
	console.log('app running and listening to port 8080');
});