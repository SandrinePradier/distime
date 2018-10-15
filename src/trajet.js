import mongoose from 'mongoose';
import fs from 'fs';
import _ from 'underscore';
import moment from 'moment';

import {Commune} from './models/commune.js';
import {Trajet} from './models/trajet.js';
import * as api from './api.js';


//HELPERS

//***********creating and saving one trajet******************

async function createTrajet(a,b, communes){
	console.log('async createTrajet called');
	let trajet = new Trajet;
			trajet.code = +a+'-'+b;
			trajet.origin = communes[a].codeCommune;
			trajet.destination = communes[b].codeCommune;
	return trajet;
}

async function saveTrajet(trajet){
	console.log('async saveTrajet called');
	let start = Date.now();
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
											// let savingTime = Date.now()-start;
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
	return saved;
}


//***********checking empty trajets******************

//This function check in Trajet Collection if property has been feeded.
//parameter : property = distance or timeTransport
// it returns the list of 'empty' Trajets
//test OK
let checkEmptyTrajet = async (property) => {
	console.log('checkEmpty called');
	return Trajet.find({property:{ $exists: false }}, (err, result) => {
		if (err) {
			console.log('error in checkEmptyTrajet');
			return error;
		}
		else {
			console.log('checkEmptyTrajet result:', result);
			return result;
		}
	})
}


//take as argument trajet code and property such distance or timeTransport
//return the trajet code when the trajet is not filled with the property
//test: OK
let checkIfOneTrajetIsEmpty = async(trajetcode,property) => {
	let returnedValue;
	return Trajet.find({code:trajetcode})
	.then((result)=>{
		let resultProperty;
		if (property === 'distance'){
			resultProperty = result[0].distance;
		}
		else if(property === 'timeTransport'){
			resultProperty = result[0].timeTransport;
		}
		// resultProperty = result[0].timeTransport; for testing only
		if (resultProperty === undefined){
			returnedValue = trajetcode;
		}
		else{
			returnedValue = 'null';
		}
		return returnedValue;
	})
	.catch((e)=> {console.log('error in trajetFind in checkIfOneTrajetIsEmpty:', e);
		return e;
	})
}

//call the function checkIfOneTrajetIsEmpty for a list of trajetcode
//for a given property ( distance , timetransport for instance)
//should return a list of trajetcode
//TEST OK
let checkIfSeveralTrajetsAreEmpty = async(array, property) => {
	let notFilled = [];
	try {
		let listOfTrajetCodeNotCompleted = [];
		function step(i){
			if(i<array.length){
				listOfTrajetCodeNotCompleted[i] = checkIfOneTrajetIsEmpty(array[i], property);
				listOfTrajetCodeNotCompleted.push(listOfTrajetCodeNotCompleted[i])
				step(i+1);
			}
			else{
				Promise.all(listOfTrajetCodeNotCompleted)
				.then((values) =>{
					notFilled = values;
						// console.log('notFilled list of trajetcode:', notFilled);
						return notFilled;
				})
				.catch((e)=> console.log(e))
			}
		}
		step(0);
	}
	catch(e){
		console.log('checkIfSeveralTrajetsAreEmpty error:', e);
		return e;
	}
}




//***********create some chunks that gather trajets with same origins******************

//From a list of trajet this function return array containing arrays 
//with trajets with comon origins. 
//test OK
let chunkTrajetsByOrigin = async(trajetList) => {
	let trajetListByOrigin = [];
	//here we extract the unique values of origins
	let originUniq = _.uniq(trajetList.map((e) => {return e.origin}));
	//here we compare the origin property in trajet with the unique values extracted
	//and gather the trajet with same origin in individual arrays
	for (let i=0; i<originUniq.length; i++){
		let testList = trajetList.filter((e) => { return e.origin === originUniq[i]});
		trajetListByOrigin.push(testList);
	}
	return trajetListByOrigin;
}


//From a list of trajet code this function return array containing arrays 
//with trajets with comon commune index. 
//test: OK
let chunkTrajetsByCommuneIndex = async(trajetCodeList) => {
	try {
		let trajetListByCommuneIndex = [];
		//here we extract the unique values of origins
		let communeIndexUniq = _.uniq(trajetCodeList.map((element)=> { 
				let splitted = element.split('-')[0];
				return splitted;
				})
		);
		console.log('communeIndexUniq:', communeIndexUniq);
		//here we compare the origin property in trajet with the unique values extracted
		//and gather the trajet with same origin in individual arrays
		for (let i=0; i<communeIndexUniq.length; i++){
			let testList = trajetCodeList.filter((e) => { return e.split('-')[0] === communeIndexUniq[i]});
			trajetListByCommuneIndex.push(testList);
		}
		return trajetListByCommuneIndex;
	}
	catch(e){
		console.log(' error in chunkTrajetsByCommuneIndex:', e);
		return e;
	}
}





//***********retreive the detailed coordinates of a trajet****************

//this function return the geoCoord of an origin from a trajet parameter
//test: OK
let ori = async function getOrigin(trajet){
	try {
		return Commune.findOne({codeCommune:trajet.origin},(err, resultOrigin) => {
			if (err){
				console.log('Inside getOrigin: the origin coordonnées could not be retreived');
				return null;
			}
			else{
				return resultOrigin;
			}
		});
	} catch(e){
		console.log(e);
		return e;
	}
}

//this function return the geoCoord of a destination from a trajet parameter
//test: OK
let dest = async function getDestination(trajet){
	try {
		return Commune.findOne({codeCommune:trajet.destination},(err, resultDestination) => {
			if (err){
				console.log('Inside getDestination: the destination coordonnées could not be retreived')
			}
			else{
				return resultDestination;
			}
		})
	} catch (e){
		console.log(e);
		return e;
	}
	
}

//this function return a trajet object from trajetcode parameter
//test : OK
let trajet = async function getTrajet(trajetCode){
	try{
		return Trajet.findOne({code:trajetCode}, (err, resultTrajet) => {
		if (err){
			console.log('Trajet to update not found');
		}
		else {
			return resultTrajet ;
		}
		})
	} catch (e){
		console.log('problem in getTrajet');
		return e;
	}
}


//***********feeding geocode for one trajet***********

//parameter; trajetcode
//return trajet object feeded with origin and destination as geocords
//test: OK
let feedOneTrajetWithGeocoord = async(trajetCode) => {
	return trajet(trajetCode)
		.then( async (result) => {
			//insert geocoordonnées in result trajet
			let resultTrajet = JSON.parse(JSON.stringify(result));
			let origin = await ori(result);
			let destination = await dest(result);
			resultTrajet.origin = origin.coordonnees;
			resultTrajet.destination = destination.coordonnees;
		 	return resultTrajet;
		})
		.catch((e) => {
			console.log(e);
			return e
		})
}



//***********feeding several trajets with api results.***********

//this function take a list of trajets codes as parameter, 
//then return a string with geocoord that will be needed for apimapbox call
//call the api nativia and mapbox
//test: OK

//not used but good to know
// const limiter = new Bottleneck({
// 		  minTime: 1000
// 		});


let feedSeveralTrajetsWithApiResults = async (listTrajetCode) => {
	let list = [];
	let geoCoordString;
	try {
		let listWithGeoCoord = [];
		function step(i){
			if(i<listTrajetCode.length){
				listWithGeoCoord[i] = feedOneTrajetWithGeocoord(listTrajetCode[i]);
				listWithGeoCoord.push(listWithGeoCoord[i]);
				step(i+1);
			}
			else {
				Promise.all(listWithGeoCoord)
				.then((values) => {

					list = values;
					console.log('list:', list);
					return list
				})
				.then((list)=> {
				//*************API NATIVA
					list.forEach((element) => {api.nativiaCall(element)});
				//*************API MAPBOX
					//we need to prepare geocord string for api
					//we need to extract origin from the 1st element of the list, as it will be the same for all
					let originForApi = list[0].origin;
					//we need to extract destination from the 24th elements of the list
					let destinationForApi = list.slice(0,24).map((e)=> { return e.destination.join()});
					destinationForApi = destinationForApi.join(';');
				  //we need to provide string such as:
					// const geoCoord = '-122.418563,37.751659;-122.422969,37.75529;-122.426904,37.759617'
				  geoCoordString = `${originForApi};${destinationForApi}`;
				  //then pass this string as parameter for api mapboxcall
				  // api.mapboxGroupCall(geoCoordString)
				  // 	.then((mapboxGroupResult)=> {
				  // 		api.mapboxGroupSave(mapboxGroupResult, list)
				  // 	})
					 //  .catch((e) => {
					 //  	console.log(e);
					 //  })
				})
				.catch((e)=>{
					console.log(e);
				})
			}
		}
		step(0);
	}
	catch (e){
		console.log('problem in feedSeveralTrajetsWithApiResults:', e);
		return e;
	}
}


export {
	createAndSaveTrajet,
	trajet,
	feedOneTrajetWithGeocoord,
	feedSeveralTrajetsWithApiResults,
	checkEmptyTrajet,
	checkIfOneTrajetIsEmpty,
	checkIfSeveralTrajetsAreEmpty,
	chunkTrajetsByOrigin,
	chunkTrajetsByCommuneIndex
};