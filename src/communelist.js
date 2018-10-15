import mongoose from 'mongoose';
import _ from 'underscore';

import {Commune} from './models/commune.js';
import {parisArr} from './models/parisseeder.js';
import {Batch} from './models/batch.js';

import * as traj from './trajet.js';


// HELPERS  *******************************************************
//here are the helpers to get a full commune list, and from it, create a batch list. 
//the batch provides a batch number, an array with communes indexes
// ( the lenght of the array is the dfined by variable 'chunk'), and a status.

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

async function createCommuneList(){
	return Commune.find({})
	.then(console.log('ok commune find'))
	.then((result)=>{
		let list=[];
		let i=0;
		for (i=0; i<result.length; i++){
			list.push(i);
		}
		return list
	})
	.catch((e)=> console.log('error when creating commune batches'))
}


async function createBatch(codeList, chunk){
	let communeCodeList = [];
	try {
		communeCodeList = _.chunk(codeList,chunk);
		return communeCodeList
	} 
	catch (e){
		console.log(e);
		return e;
	}
}


async function saveBatches(chunkList){
		console.log('launched saveBatches');
		Batch.find({}, (err, resultBatch) => {
			if (err){ console.log('saveBatches batch.find : error')};
			if (resultBatch.length>0){
				console.log('batches already exist:', resultBatch);
			}
			else{
				console.log('let\'s create batches');
				let i=0;
				for (i=0; i<chunkList.length; i++){
					let batch = new Batch;
					batch.batchName = i.toString();
					batch.communesIndex = chunkList[i];
					batch.status = "ToDo";
					console.log(batch);
					batch.save((err, saved)=>{
						if (err){
							console.log('error when saving batches');
						}
						else{
							console.log(`batch ${batch.batchName} has been saved`)
						}
					})
				}
			}
		})
}

async function changeBatchStatus(batchName, status){
	const query = {batchName:batchName};
	const updateDoc = {status:status};
	const option = {upsert:false};
	try{
		return Batch.findOneAndUpdate(query,updateDoc,option,(err, resultUpdated) =>{
			if(err){
				console.log('error when calling Batch.findOneAndUpdate in changeBatchStatus');
			}
			else{
				console.log('resultUpdated:', resultUpdated);
			}
		})
	}
	catch(e){
		console.log(e);
		return e;
	}
}


//gived the number of communes.
//tested: OK
async function communesNumber(){
	let communeslistlength;
	return Commune.find({})
		.then((result)=>{
			communeslistlength = result.length;
			return communeslistlength;
		})
		.catch((error)=>{
			console.log(error);
			return error;
		})
	}
	

//**********************************

//as the process for feeding matrix is very long, this function aims at
//checking if 'in process' batch are still processing, or wether they can be turned in done.
//gives an array with the list of trajets for the batches still in process 
// and check wether these trajets have been feeded
//test:NOT WORKING

// async function checkIfBatchHasBeenCompleted(){
// 	communesNumber()
// 	.then((communesNumber)=>{
// 		let listlength = communesNumber;
// 		let chunkedArraysByCommuneIndex;
// 		Batch.find({status:'InProcess'},(err, resultBatch) =>{
// 			if(err){
// 				console.log(err);
// 				return err;
// 			}
// 			else{
// 				let allTrajetInprocess = [];
// 				resultBatch.forEach((element) => {
// 					let communesIndexString = element.communesIndex.map((e)=> {return e.toString()});
// 					let listTrajet = [];
// 					let trajetCode = '';
// 					let i=0;
// 					communesIndexString.forEach((item) => {
// 						for (i=0; i<listlength; i++){
// 						trajetCode = `${item}-${i}`
// 						listTrajet.push(trajetCode);
// 						}
// 					})
// 					allTrajetInprocess.push(listTrajet);
// 				})
// 				//ici on récupère les index communes du batch regroupé par origin trajet
// 				let chunkedArraysByCommuneIndex = async () => {
// 					let myArray = await traj.chunkTrajetsByCommuneIndex(_.flatten(allTrajetInprocess));
// 					return myArray
// 				}
// 				chunkedArraysByCommuneIndex()
// 				.then( async (result)=> {
// 					// console.log('chunkedArraysByCommuneIndex result:', result);
// 					console.log('chunkedArraysByCommuneIndex result[0]:', result[0]);
// 					//attention, on teste avec result[0], il faudrait vérifier toutes les valeurs
// 					let resultNotFilled = async () => {
// 						let resultNotFilledInside = await traj.checkIfSeveralTrajetsAreEmpty(result[0], 'timeTransport');
// 						console.log('resultNotFilledInside 1 :', resultNotFilledInside);
// 						return resultNotFilledInside;
// 					}
// 					resultNotFilled();

// 					// .then((resultNotFilled)=>{
// 					// 	console.log('result notFilled List 2:', resultNotFilled)
// 					// })
// 				})
// 				.catch((error)=>{
// 					console.log(error);
// 					return error;
// 				})

	
				


// 				//ici test sur le début de l'array car sinon pas assez
// 				//de mémoire pour le call statck
// 				//en tout cas fonctionne
// 				// traj.checkIfSeveralTrajetsAreEmpty(chunkedArraysByCommuneIndex[0], 'timeTransport');
// 				//=> reste donc à voir comment trier les éléments de l'array
					


// 				//=> les regrouper en sous chunk qui commencent par le même numéro de trajet
// 				//=> on pourra tester les 10 premiers, et si ils révélent des trajets non rempli
// 				//=> on pourra en déduire que le batch reste inProcess et eviter de boucler sur la totalité
				
// 				//ici pour un trajet, ça marche: A garder
// 				// traj.checkIfOneTrajetIsEmpty(array[15], 'distance')
// 				// .then((value)=> console.log('value:', value))
// 				// traj.checkIfOneTrajetIsEmpty(array[10], 'timeTransport')
// 				// .then((value)=> console.log('value:', value))
// 			}
// 		})
// 		// return array;
// 	})
// 	.catch((error)=> {
// 		console.log(error);
// 		return error;
// 	})
// }


// 	//prend les batch avec le status 'in process'
// 	//lister les trajets qui correspondent aux numéros de communes
// 	//verifie si les trajets commençant par les numéros de communes ont bien une valeur dans
// 	// distance,timeDriving,timeTransport
// 	//
// 	//Si OUI: change le status en 'Done'
// 	//Si non: laisse le status en in process


//**********************************


export {
	callApiGouv,
	parisArrSeeder,
	createCommuneList,
	createBatch,
	saveBatches,
	changeBatchStatus,
	// checkIfBatchHasBeenCompleted
};