import mongoose from 'mongoose';

import {Commune} from './models/commune.js';
import {parisArr} from './models/parisseeder.js';
import {Batch} from './models/batch.js';


// HELPERS for 1ST STEP *******************************************************
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
	try {
		communeCodeList = _.chunk(codeList,chunk);
		// console.log('communeCodeList:', communeCodeList);
		return communeCodeList
	} catch (e){
		console.log(e);
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
					batch.status = "to be launched";
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


export {
	callApiGouv,
	parisArrSeeder,
	createCommuneList,
	createBatch,
	saveBatches
};