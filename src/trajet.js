import mongoose from 'mongoose';
import fs from 'fs';
import _ from 'underscore';
import moment from 'moment';

import {Commune} from './models/commune.js';
import {Trajet} from './models/trajet.js';


// HELPERS for 2ND STEP *******************************************************
//OK works!

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


//To finish.
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



// HELPERS for 3RD STEP *******************************************************
//OK works!


//***********retreive the detailed coordinates of a trajet****************

let ori = async function getOrigin(trajet){
	// Trajet.findOne()
	try {
		return Commune.findOne({codeCommune:trajet.origin},(err, resultOrigin) => {
			if (err){
				console.log('Inside mapbox: the origin coordonnées could not be retreived');
				return null;
			}
			else{
				console.log('origin:', resultOrigin);
				return resultOrigin;
			}
		});
	} catch(e){
		console.log(e);
	}
}

let dest = async function getDestination(trajet){
	try {
		return Commune.findOne({codeCommune:trajet.destination},(err, resultDestination) => {
			if (err){
				console.log('Inside mapbox: the origin coordonnées could not be retreived')
			}
			else{
				console.log('destination:', resultDestination);
				return resultDestination;
			}
		})
	} catch (e){
		console.log(e);
	}
	
}

let trajet = async function getTrajet(trajetCode){
	try{
		return Trajet.findOne({code:trajetCode}, (err, resultTrajet) => {
		if (err){
			console.log('Trajet to update not found');
		}
		else {
			console.log('resultTrajet in getTrajet:', resultTrajet);
			return resultTrajet ;
		}
		})
	} catch (e){
		console.log('problem in getTrajet');
	}
}


export {
	createAndSaveTrajet,
	trajet,
	dest,
	ori,
	checkEmptyTrajet
};