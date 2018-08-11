
import express from 'express';

import mongoose from 'mongoose';
import request from 'request';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotEnv from 'dotenv';

dotEnv.config();

import {Commune} from './models/commune.js';
import {Trajet} from './models/trajet.js';
import {parisArr} from './models/parisseeder.js';

// App init
let app = express();

app.use(morgan('dev'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// setting and connecting our data base
mongoose.connect(process.env.DB_HOST, function(err){
	if (err){ throw err;}
	else {
		console.log('the data base is connected');
		app.listen(process.env.PORT, () =>{
			console.log ('app running and listening to port' + process.env.PORT);
		});
	}
});


//1ST STEP *******************************************************

 //1 - getting the full list of communes in Ile de France

 //our variables
let departmentIDF = ['77', '78', '91', '92', '93', '94', '95'];


//1-a getting the list of communes from all department exepted Paris
function callApiGouv(n){
	let urlApiGouv = "https://geo.api.gouv.fr/departements/"+departmentIDF[(n)]+"/communes?fields=nom,code,codesPostaux,centre,surface,contour,codeDepartement,departement,codeRegion,region&format=geojson&geometry=centre";
	request(urlApiGouv, (error, response, body) => {
		if (error){
			console.log('error:', error);
		}
		else {
			console.log('statusCode:', response.statusCode);
			let bodyjson = JSON.parse(body);
			let communesList = bodyjson.features;
			console.log('number of communes found:', communesList.length);
			// console.log('communeList:', communesList);
			let i=0;
			for (i=0; i<communesList.length; i++){

				let commune = new Commune;
				commune.name = communesList[i].properties.nom;
				commune.codeCommune = communesList[i].properties.code;
				commune.coordonnees = communesList[i].geometry.coordinates;
				commune.codeDepartment = communesList[i].properties.codeDepartement;
				console.log('commune:', commune);

				Commune.findOne({codeCommune:communesList[i].properties.code}, function(err, result){
					if (err) console.log('error')
					if (result){
						console.log('commune already in the DB');
					}
					else {
						commune.save((err) => {
							if(err){
								return err;
								console.log('commune could not be saved');
							}
							else {
								console.log('new commune saved:', commune);
							}
						});
					}
				})
			}
		}
	})
}

// let j=0;
// for (j=0; j<departmentIDF.length; j++){
// 	callApiGouv(j);
// }

//1-b getting the list of Paris arrondissement and store them as communes
function parisArrSeeder(){
	console.log('parisArr:', parisArr);
	let l=0;
	for (l=0; l<parisArr.length; l++){
		let commune = new Commune;
		commune.name = parisArr[l].name;
		commune.codeCommune = parisArr[l].codeCommune;
		commune.coordonnees = parisArr[l].coordonnees;
		commune.codeDepartment = parisArr[l].codeDepartment;
		Commune.findOne({name:commune.name}, function(err, result){
			if (err) {
				console.log ('error in parisArrSeeder Commune findOne');
			}
			if (result){
				console.log('the arrondissement already in DB');
			}
			else{
				commune.save( (err)=>{
					if (err){
						console.log('Error when saving Paris Arrondissements')
					}
					else{
						console.log('arrondissement '+commune.name+ 'saved')
					}
				})
			}
		})
	}
}

// parisArrSeeder();



//2ND STEP *******************************************************
//Building the matrix with all communes

//2-a buildmatrix function

async function buildMatrix(n){
	//this function build a matrix, represented with Trajet collection.
	//it build several trajet with the one commune origin, and all the possible communes destination
			console.log('launched buildMatrix n°:', n);
			Commune.find({}, (err, resultCommune) => {
				if (err){console.log('buildMatrix commune.find: error')}
				else{
					let communes = resultCommune;
						let k=0;
						for (k=0; k<=communes.length; k++){
								createAndSaveTrajet(n,k, communes);
						}
				}
			})
}

async function createTrajet(a,b, communes){
	console.log('async createTrajet called');
	let trajet = new Trajet;
			trajet.code = +a+'-'+b;
			trajet.origin = communes[a];
			trajet.destination = communes[b];
	return trajet;
}

async function saveTrajet(trajet){
	console.log('async saveTrajet called');
	Trajet.findOne({code:trajet.code}, (err, resultTrajet)=>{
								if (err){
									console.log('buildMatrix trajet.find: error');
									return null;
								}
								if (resultTrajet){
									console.log('Trajet already exist:', resultTrajet.code);
									return null;
								}
								else{
									console.log('let save trajet');
									trajet.save((err, saved)=>{
										if (err) {
											console.log('an error has occured when saving the trajet');
											return null;
										}
										else {
											console.log('trajet saved :', saved);
											return saved;
										}
									})
								}
	});
}


async function createAndSaveTrajet(a,b,communes){
	console.log('async createAndSaveTrajet called: ' +a+ '-' +b+ '.');
	let created = await createTrajet(a,b,communes);
	let saved = await saveTrajet(created);
}

async function matrixAll(a,b){
	Commune.find({}, (err, resultCommune) => {
	if (err){
		console.log('error in Commune.find when calling buildMatrix')
	}
	else{
		resultCommune.forEach(async(element)=>{
			let n= resultCommune.indexOf(element);
			if (n>=a && n<b){
				let built = await buildMatrix(n);
			}
		});
	}
});
}


// matrixAll(1,10);



//2-b Applying buildingMatrix to the whole list of communes

// Initially the function buildMatrix creating trajets with all communes at origin and all communes at destination
//requires too much heap memory for node, so we have amended it so that it creates trajet for one commune at origin 
//and all other communes at destination.
// than we make a for loop for several origins.
// => We need to create a function that slice the fulllist of communes in ranges of several communes.
// arr.slice(start, end) start included, end excluded;
// jumpArray will represent an array where rank i will be the start of the slice and i+1 the end of the slice
// jumpNumber will be the number of communes  of the slice


let jumpArray = [0];
let jumpNumber = 10; //we can test many values. upto 50 is OK for node

function fillJumpArray(){
	Commune.find({}, (err, resultCommune) => {
	if (err){
		console.log('error in Commune.find when calling buildMatrix')
	}
	else{
		// 1 - we create the jumpArray from jumpNumber to jumpNumber until the number of communeList
		let communeList = resultCommune;
		let a;
		for (a=0; a<communeList.length-jumpNumber; a=a+jumpNumber){
			let number = a+jumpNumber;
			jumpArray.push(number);
		}
		jumpArray.push(communeList.length);
		console.log('jumpArray:', jumpArray);
		return jumpArray;
	}
})
}

// fillJumpArray();

// jumpArray.forEach(async(element)=>{
// 	let i= jumpArray.indexOf(element);
// 	console.log('i de jumparray: ', i);
// 		// await matrixAll(i,i+1);
// });




// async function processArray(array, list){
// 		console.log('processArray is called');
// 		// once one slice has been processed, we will launch another slice, 
// 		//until all the slices have been processed ( ie the full list of communes)
// 			let i;
// 			for (i=0; i<array.length-1; i++){
// 				await processSlice(list, i, i+1);
// 			}
// 		}

// async function processSlice(list,a,b){
// 	//for a range of communes, we will launch the buildMatrix
// 		let range = list.slice(jumpArray[a],jumpArray[b]);
// 		console.log('under processing slice: ' +jumpArray[a]+ ' to ' +jumpArray[b]+ '.');
// 		let n;
// 		for (n=jumpArray[a]; n<jumpArray[b]; n++){
// 			buildMatrix(n);
// 		}
// }

//this is not fully finalised. 



//3RD STEP *******************************************************
//feeding the matrix with distance and driving time using mapbox API
//NB: distance will be retreived in meter, and duration in seconds. we will convert distance in km, and duration in minutes

//3-a Getting the distance and driving time for one trajet.
function mapboxCall(trajet){
	console.log('mapboxCall called');
	let lonO=trajet.origin.coordonnees[0];
	let latO=trajet.origin.coordonnees[1];
	let lonD=trajet.destination.coordonnees[0];
	let latD=trajet.destination.coordonnees[1];
	let urlMapbox = 'https://api.mapbox.com/directions/v5/mapbox/driving/'+lonO+'%2C'+latO+'%3B'+lonD+'%2C'+latD+'.json?access_token='+process.env.MAPBOX_TOKEN
	let drivingTimeMin = '';
	let distanceTrajetKm = '';
	request(urlMapbox, (error, response, body) => {
		if(error){
			console.log('error when calling mapbox API');
		}
		else{
			let jsonBody = JSON.parse(body);
			let drivingTime = jsonBody.routes[0].duration;
			drivingTimeMin = drivingTime/60;
			console.log('drivingTimeMin:', drivingTimeMin);
			let distanceTrajet = jsonBody.routes[0].distance;
			distanceTrajetKm = distanceTrajet/1000;
			console.log('distanceKM:', distanceTrajetKm);
			updateTrajet(trajet,distanceTrajetKm,drivingTimeMin);
		}
	})
}


// 3-b Updating the trajet with the distance and driving time: OK
// AModel.findOneAndUpdate(conditions, update, options, callback)
// options : specify upsert : true => if object not created, it will create it.
function updateTrajet(trajet, dist, drive){
	let query = {code:trajet.code};
	let updateDoc = {distance:dist, timeToDestinationDriving:drive};
	let option = {upsert:true};
	Trajet.findOneAndUpdate(query,updateDoc,option,(err, resultUpdated) =>{
		if(err){
			console.log('error when calling trajet.findOne in updateTrajet');
		}
		else{
			console.log('resultUpdated:', resultUpdated);
		}
	})
}


// 3-c feeding the matrix by calling the function for all trajets

// test for one trajet: OK

Trajet.findOne({code:'2-32'}, (err, resultTrajet) => {
	if (err){
		console.log('Trajet to updtae not found');
	}
	else {
		console.log('resultTrajet:', resultTrajet);
		mapboxCall(resultTrajet);
		nativiaCall(resultTrajet);
	}
})


// 4RTH STEP *******************************************************
// feeding the matrix with transport time using nativia.io API
// NB: we will select "best" journey (The best journey if you have to display only one.)
// NB: duration will be retreived in seconds. we will convert duration in minutes.


// exemple de trajet départ arrivé
// https://6e8bb014-7672-40a6-a747-143e75ced700@api.navitia.io/v1/journeys?from=-122.4752;37.80826&to=-122.402770;37.794682&datetime=20170407T120000

//4-a Building the function to get the transport time for one trajet

function nativiaCall(trajet){
	console.log('nativiaCall called');
	let lonO=trajet.origin.coordonnees[0];
	let latO=trajet.origin.coordonnees[1];
	let lonD=trajet.destination.coordonnees[0];
	let latD=trajet.destination.coordonnees[1];
	// let urlNativia = 'https://'+process.env.NATIVIA_TOKEN'@api.navitia.io/v1/journeys?from='+lonO+';'+latO+'&to='+lonD+';'+latD+'&datetime=20170407T120000';
	let urlNativia = 'https://'+process.env.NATIVIA_TOKEN+'@api.navitia.io/v1/journeys?from='+lonO+';'+latO+'&to='+lonD+';'+latD;
	let transportTimeMin = '';
	request(urlNativia, (error, response, body)=>{
		if (error){
			console.log('error when calling api nativia');
		}
		else{
			let bodyjson = JSON.parse(body);
			// console.log('body.journeys:', bodyjson.journeys);
			console.log('type:', bodyjson.journeys[0].type);
			// console.log('duration:', bodyjson.journeys[0].duration);
			let transportTime = bodyjson.journeys[0].duration;
			transportTimeMin = transportTime/60;
			console.log('transportTimeMin:', transportTimeMin);
			updateTrajetBis(trajet,transportTimeMin);
		}
	})
}

function updateTrajetBis(trajet, transp){
	let query = {code:trajet.code};
	let updateDoc = {timeToDestinationTransport:transp};
	let option = {upsert:true};
	Trajet.findOneAndUpdate(query,updateDoc,option,(err, resultUpdated) =>{
		if(err){
			console.log('error when calling trajet.findOne in updateTrajet');
		}
		else{
			console.log('resultUpdated:', resultUpdated);
		}
	})
}



//4-b feeding the matrix by calling the function for all documents

//test for one trajet: OK
// Trajet.findOne({code:'5-3'}, (err, resultTrajet)=>{
// 	if (err){
// 		console.log('Trajet to update not found');
// 	}
// 	else {
// 		console.log('resultTrajet:', resultTrajet);
// 		nativiaCall(resultTrajet);
// 	}
// })