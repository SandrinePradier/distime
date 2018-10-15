
import express from 'express';

import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotEnv from 'dotenv';
import fs from 'fs';
import _ from 'underscore';
import moment from 'moment';
import Bottleneck from 'bottleneck';

dotEnv.config();

import {Commune} from './models/commune.js';
import {Trajet} from './models/trajet.js';
import {parisArr} from './models/parisseeder.js';
import {Batch} from './models/batch.js';
import * as com from './communelist.js';
import * as api from './api.js';
import * as traj from './trajet.js';

// App init
let app = express();

app.use(morgan('dev'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


//cors
// CORS cross-origin
app.use(function (req, res, next) {
 // res.header(`Access-Control-Allow-Origin`, `https://mywebsite);
 res.header(`Access-Control-Allow-Origin`, `*`);
 res.header(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE, OPTIONS`);
 res.header(`Access-Control-Allow-Headers`, `Origin, X-Requested-With, Content-Type, Accept`);
 // intercept OPTIONS method
  if ('OPTIONS' == req.method) res.sendStatus(200);
  else next();
 
});



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

//END POINTS *******************************************************

//send back the whole list of batches with status
app.get('/', (req, res) => {
	Batch.find({}, (err, result)=>{
		if(err){
			res.status(202).json({'error': 'error when retreiving batchList'})
		}
		else{
			res.status(200).json({'data': result})
		}
	})
})

// Endpoint with batch number as parameter
// to launch build matrix and api call in this request.
//test: OK
app.get('/:id', (req, res) => {
	console.log('request to launch batch:',req.params.id);
	let batchNumber = req.params.id;
	console.log('batchNumber:', batchNumber);
	Batch.find({batchName:req.params.id}, (err, result)=>{
		if(err){
			res.status(202).json({'error': 'error when retreiving batchList'})
		}
		else{
			console.log('result:', result);
			com.changeBatchStatus(result[0].batchName, 'InProcess')
				.then(()=> {
					res.status(200).json({'data': result});
				})
				.then(async() => {
					let matrix = await buildMatrixForABatch(result[0].communesIndex)
					.then( async(matrix) => {
						console.log('batchNumber again:', batchNumber);
						// let feededMatrix = await feedMatrixForABatch()
						// .then((feededMatrix) => {
						// 		com.changeBatchStatus(result[0].batchName, 'Done')
						// })
					})
				})
			//if batch pair : use 1stKey, if batch impair : use 2ndkey
				.catch((e) => console.log(e))
		}
			//sinon renvoyer un message que ce batch est déjà lancé.
			//ensuite il faudra que le batch change de status
	})
})



//1ST STEP *******************************************************

		//get the full list of communes in Ile de France and set up in batchs ( chunks of communes)
		//TODO: RETEST

		 //our variables
		let departmentIDF = ['77', '78', '91', '92', '93', '94', '95'];

		//>>>>>>>>>>>>>>To define
		// Chunk should be a multipl of 3
		let chunk = 3;


		//1-a getting the list of communes from all department exepted Paris

			//>>>>>>>>>>>>>>To be launched one time only
			// let j=0;
			// for (j=0; j<departmentIDF.length; j++){
			// 	com.callApiGouv(j);
			// }

		//1-b getting the list of Paris arrondissement and store them as communes

			//>>>>>>>>>>>>>>to be launched One time only
			// com.parisArrSeeder();

		//1-c creating the communeCodeList Array
		//each commune will be maped with an integer, and listed in an array.
		// the array will be dispatched in sub arrays to enable to deal the list by batches.
		// the variable chunk sets the length of the sub arrays.

			//>>>>>>>>>>>>>>To be launched One time only
			// com.createCommuneList()
			// .then((list) => com.createBatch(list, chunk))
			// .then((result) => com.saveBatches(result))
			// .catch((e) => console.log('a problem when create Batch and saving batch has occured'))




// 2ND STEP *******************************************************

		//Building the matrix with all communes
		// The matrix will be build progressively when user launch batches from user interface and call
		//see also trajet.js file


		//***********creating matrix for one commune 
		//creating all possible trajets from this commune as origin******************
		//communeCode is the communeIndex

		async function buildMatrix(communeCode){
					console.log('launched buildMatrix n°:', communeCode);
					Commune.find({}, (err, resultCommune) => {
						if (err){console.log('buildMatrix commune.find: error')}
						else{
							let communes = resultCommune;
								let k=0;
								for (k=0; k<communes.length; k++){
										traj.createAndSaveTrajet(communeCode,k, communes);
								}
						}
					})
		}


		//***********applying build matrix to one batch******************
		//already tested with a batch of 30 communes: OK


		let buildMatrixForAListOfCommunes = async(list) => {
			list.forEach((communeCode) => {
				buildMatrix(communeCode);
			});
			return 'OK';
		}
			
		let buildMatrixForABatch = async (batch) => {
			//ex of parameter: array with index of communes : [168, 169, 170, 171, 172, 173]
			// the number will set the number of elements for the chunk size.
			//for testing, should be batch / 3
			//in real life, should be set to 10 for a batch of 30 communes
			//tested: OK
			const chunkedList = await _.chunk(batch, 1);

			console.log('chunkedList:', chunkedList);
			// ex chunkedList of 2: [ [ 168, 169 ], [ 170, 171 ], [ 172, 173 ] ]
			const resulta = await buildMatrixForAListOfCommunes(chunkedList[0]);
			const resultb = await buildMatrixForAListOfCommunes(chunkedList[1]);
			const resultc = await buildMatrixForAListOfCommunes(chunkedList[2]);
			const final = await result(resulta,resultb,resultc,chunkedList);
			return final;
		}

		let result = async (a,b,c,list) => {
			//to be improved: see how to go next line
			// change the batch status
			fs.appendFileSync('savingTimes.txt', `trajet saving starting by ${list} :ok, on ${moment().format('LLLL')}//`);
		}




//3RD STEP *******************************************************

//********** Feeding Matrix For A Batch ****************

		//TODO
		//from a list of trajet
		//gather them from origin, and group them in arrays with all same origins: OK
		//transform origin and destination into geoCoord for a chunk of 24: OK
		//prepare variable geoCoord for this group of 24: OK
		//apply mapBoxgroupCall to each groupOf24 : OK
		//get result and save them for mapBoxgroupCall: OK
		//apply nativia to the 24: OK
		//******************
		//relaunch feedmatrixForABatch while 
		//resultEmptyTrajet.lenght>0; else return done: NOT OK NOW returning Done too early

		
		async function feedMatrixForABatch(){
			traj.checkEmptyTrajet('distance')
			//return an array with trajets which needs to be filled with destination etc....
				.then((resultEmptyTrajet) => {
					if (resultEmptyTrajet.length>0){
						console.log('resultEmptyTrajet.length', resultEmptyTrajet.length);
						//prepare this list gathering same origin together in arrays,
						return traj.chunkTrajetsByOrigin(resultEmptyTrajet);
					}
					else {
						console.log('resultEmptyTrajet.length', resultEmptyTrajet.length);
						return null;
					}
				})
				.then(async(chunkedList) => {
					// let done = false;
					if (chunkedList.length>0)  {
						//we will work on the 1st array, to make sure all origins are the same: //list[0].
						//we will take the 1st 24th of the list.
						console.log('chunkedList length:', chunkedList.length);
						chunkedList.forEach((e)=> console.log(e.length));
						traj.feedSeveralTrajetsWithApiResults(chunkedList[0].slice(0,24).map((e) => {return e.code}))
						.then( async() => { 
							await feedMatrixForABatch();
							// done = false;
							// console.log('done:', done);
						})
					}
					else {
						console.log('From feedmatrixForABatch the batch is completed');
						done = true;
						console.log('done:', done);
						return done;
					}
				})
				.catch((e) => console.log(e))
		}
	
//only for testing, as this function will be called from the route app.get('/:id'
// feedMatrixForABatch();

// only for testing
// com.checkIfBatchHasBeenCompleted();
	
//only for testing nativia call with several token
let testList = ['1-65', '1-25', '1-135']
// traj.feedSeveralTrajetsWithApiResults(testList);

// // 4TH STEP *****************************************
// // exporting DB to csv



