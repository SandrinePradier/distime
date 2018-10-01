import mongoose from 'mongoose';
import fs from 'fs';
import _ from 'underscore';
import moment from 'moment';

import {Commune} from './models/commune.js';
import {Trajet} from './models/trajet.js';


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

//This function check in Trajet Collection if distance has been feeded.
// it returns the list of 'empty' Trajets
//test OK
let checkEmptyTrajet = async () => {
	console.log('checkEmpty called');
	return Trajet.find({distance:{ $exists: false }}, (err, result) => {
		if (err) {
			console.log('error in checkEmptyTrajet');
			return error;
		}
		else {
			return result;
		}
	})
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



export {
	createAndSaveTrajet,
	trajet,
	feedOneTrajetWithGeocoord,
	checkEmptyTrajet,
	chunkTrajetsByOrigin
};