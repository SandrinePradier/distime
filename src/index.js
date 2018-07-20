
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


 //1 - getting the full list of communes in Ile de France

 //our variables
let departmentIDF = ['77', '78', '91', '92', '93', '94', '95'];


//getting the list of communes from all department exepted Paris
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

//getting the list of Paris arrondissement and store them as communes
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


function buildMatrix(n){
	//this function build a matrix, represented with Trajet collection.
	//it build several trajet with the same commune origin, and all the possible communes destination
			console.log('lets create Trajet collection');
			Commune.find({}, (err, resultCommune) => {
				if (err){console.log('buildMatrix commune.find: error')}
				else{
					let communes = resultCommune;
					let i=n;
						let k=0;
						for (k=0; k<communes.length; k++){
							let trajet = new Trajet;
							trajet.origin = communes[i];
							trajet.destination = communes[k];
							// console.log('trajet:', trajet);
							Trajet.findOne({origin:trajet.origin, destination:trajet.destination}, function(err, resultTrajet){
								if (err){
									console.log('buildMatrix trajet.find2: error');
								}
								if (resultTrajet){
									console.log('Trajet already exist');
								}
								else{
									trajet.save((err)=> {
										if (err) {
											console.log('an error has occured when saving the trajet');
										}
										else {
											console.log('trajet saved ');
										}
									})
								}
							})
						}
				}
			})
}

// Since the function buildMatrix filling trajets with one commune at origin
// and all other communes at destination requires too much heap memory for node, we will
// need to slice the commune list to execute it.
// arr.slice(début, fin) 
//end excluded

// We need to create a function that slice the list of communes in range of 50 communes.
// ( 50 have been tested as OK for node not crashing)

let jumpArray = [0];
let jumpNumber = 10; //we can test many values. upto 50 is OK for node

Commune.find({}, (err, resultCommune)=>{
	//will be an array with value jumbNumber to jumpNumer ( ex de 10 en 10) from 0 to the number of communes
	if (err){
		console.log('error in Commune.find when calling buildMatrix')
	}
	else{
		// 1 - we create the array from 50 to 50
		let communeList = resultCommune;
		let a;
		for (a=0; a<communeList.length-jumpNumber; a=a+jumpNumber){
			let number = a+jumpNumber;
			jumpArray.push(number);
		}
		jumpArray.push(communeList.length);
		console.log('jumpArray:', jumpArray);

		//we need to find a way to launch the function by slice, 
		// and wait the buildMatrix is finished for a given slice to start the buildmatrix for a new slice.
		processArray(jumpArray, communeList);
	}
})


async function processArray(array, list){
		console.log('processArray is called');
			let i;
			for (i=0; i<array.length; i++){
				await processSlice(list, i, i+1);
			}
			console.log('full list DONE!');
		}

async function processSlice(list,a,b){
	console.log('processSlice is called')
	//for a range of communes, we wil launch the buildMatrix
		let range = list.slice(jumpArray[a],jumpArray[b]);
		console.log('range.length:', range.length);
		let n=a;
		for (n=a; n<range.length; n++){
			buildMatrix(n);
			console.log('launched buildMatrix n°:', n)
		}
}



