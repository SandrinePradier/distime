//defining our variables

import express from 'express';
let app = express();
import mongoose from 'mongoose';
import request from 'request';
import bodyParser from 'body-parser';


// setting and connecting our data base

mongoose.connect('mongodb://localhost:27017/distimetest', function(err){
	if (err){ throw err;}
	else {console.log('the data base is connected');}
});


// creating Schema

let Schema = mongoose.Schema;

let communeSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	codeCommune : {
		type: String,
		required: true
	},
	department : {
		type: String,
		required: true
	},
	codeDepartment : {
		type: String,
		required: true
	},
	region : {
		type: String,
		required: true
	},
	codeRegion : {
		type: String,
		required: true
	},
	codesPostaux : {
		type: Array,
		required: true
	},
	geometry: {
		type : {
			type: String, required: true},
		coordinates : {
			type: Array, required: true}
	}
});


// creation of a model based on our communeSchema

let Commune = mongoose.model('commune', communeSchema);




// getting communes list

// let DepartmentIDF = [];
let url = "https://geo.api.gouv.fr/departements/77/communes?fields=nom,code,codesPostaux,centre,surface,contour,codeDepartement,departement,codeRegion,region&format=geojson&geometry=centre";

request.get(url, (error, response, body) => {
  let bodyjson = JSON.parse(body);
  // console.log('here is the response:', response);
  // console.log('here is the body:', bodyjson);
  // console.log('body:', bodyjson);
  console.log('body1st:', bodyjson.features[0]);

  let testCommune = new Commune;

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

  
  testCommune.save((err) => {
			if(err){
				return err;
				console.log('testCommune could not be saved');
			}
			else {
				console.log('testCommune saved:', testCommune);
			}
		});

});


//launching our app

app.listen('8080', () =>{
	console.log ('app running and listening to port 8080');
});