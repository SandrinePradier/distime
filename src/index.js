
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

function buildMatrix(){
	Trajet.find({}, (err, resultTrajet) => {
		if (err){
			console.log('buildMatrix trajet.find: error');
		}
		else{
			console.log('lets create Trajet collection');
			Commune.find({}, (err, resultCommune) => {
				if (err){console.log('buildMatrix commune.find: error')}
				else{
					let communes = resultCommune;
					// console.log(communes.length);
					let trajet = new Trajet;
					let i=0;
					for (i=0; i<communes.length; i++){
						console.log('communes[i]:', communes[i]);
						let k=0;
						for (k=0; k<communes.length; k++){
							trajet.origin = communes[i];
							trajet.destination = communes[k];
							console.log('trajet:', trajet);
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
											console.log('trajet saved: ');
										}
									})
								}
							})
						}
					}
				}
			})
		}
	})
}


buildMatrix();




