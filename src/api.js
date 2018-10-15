import mongoose from 'mongoose';
import axios from 'axios';
import _ from 'underscore';

import {Commune} from './models/commune.js';
import {Trajet} from './models/trajet.js';


//MAPBOX API

	//feeding the matrix with distance and driving time using mapbox API
	//NB: distance will be retreived in meter, and duration in seconds. 
	//we will convert distance in :
	//distanceTrajetKm in km*10, and duration in minutes*10

	//problematics: 
		// max request per minute: 300 / max request per month : 50000 / max 25 coordinates/request
		//one call enable to provide one source / with 24 destinations
	
	// ex: https://api.mapbox.com/directions-matrix/v1/mapbox/walking/-122.418563,37.751659;-122.422969,37.75529;-122.426904,37.759617?sources=1&annotations=distance,duration&access_token=pk.eyJ1Ijoic2FuZHJpbmVwcmFkaWVyIiwiYSI6ImNqajJ3MWo3dDBwcHMzcXBnNWUydzZueGMifQ.9IdBegXkVdwugY4k5N3nPQ

	
	//************function calling api for One origin / 24 destinations max***********

	//take one parameter: string geoCoord
	//return an object with distances(meters) and durations(seconds) for the 24 trajets
	//test: OK


	let mapboxGroupCall = async (geoCoord) => {
		console.log('mapboxGroupCall called');
		let mapboxGroupResult = {};
		//geoCoord is a string ex '-122.418563,37.751659;-122.422969,37.75529;-122.426904,37.759617'
		// limiter.submit(request, urlMapbox, (error, response, body) => 
		const urlMapbox = 'https://api.mapbox.com/directions-matrix/v1/mapbox/driving/'+geoCoord+'?sources=0&annotations=distance,duration&access_token='+process.env.MAPBOX_TOKEN
		// console.log('url: ', urlMapbox);
		return axios.get(urlMapbox)
		.then((response)=> {
			mapboxGroupResult.distances = response.data.distances[0];
			mapboxGroupResult.durations = response.data.durations[0];
			mapboxGroupResult.destinations = response.data.destinations.map((e) => { return e.location});
			return mapboxGroupResult;
		})
		.catch((error)=>{
			console.log('error when calling mapbox API');
			return error;
		})
	}


	//**************Updating the trajet with the distance and driving time***********

	// AModel.findOneAndUpdate(conditions, update, options, callback)
	// options : specify upsert : true => if object not created, it will create it.
	//test: OK

	//updating one trajet
	function updateTrajet(trajetCode, dist, drive){
		const query = {code:trajetCode};
		const updateDoc = {distance:dist, timeDriving:drive};
		const option = {upsert:true};
		Trajet.findOneAndUpdate(query,updateDoc,option,(err, resultUpdated) =>{
			if(err){
				console.log('error when calling trajet.findOne in updateTrajet');
			}
			else{
				console.log('resultUpdated:', resultUpdated);
			}
		})
	}


	//upddating the group of trajets
	function mapboxGroupSave(mapboxGroupResult, list){
		let distList = mapboxGroupResult.distances;
  	let driveList = mapboxGroupResult.durations;
  	let destinationList = mapboxGroupResult.destinations;
  	let resultArray = _.zip(destinationList,distList,driveList).slice(1,24);
  	let feededList = list.slice(0,23);
  	feededList.forEach((element, index)=>{
  		element.result = resultArray[index]
  	})
  	console.log('feededList:', feededList);
  	feededList.forEach((element, index) =>{
  		console.log(index);
  		let code = element.code;
  		let dist;
  		if (element.result[1] === null) {
  			dist = '9999';
  		}
  		else {
  			dist = element.result[1]/1000;
  			dist = Number.parseFloat(dist).toFixed(1)*10;
  			//dist is now in centaines de KM
  		}
  		let drive;
  		if (element.result[2] === null) {
  			drive = '9999';
  		}
  		else {
  			drive = element.result[2]/60;
  			drive = Number.parseFloat(drive).toFixed(1)*10;
  			//drive is now in centaines de minutes
  		}
  		updateTrajet(code, dist, drive)
  	})
	}

//nativia.io API

	// feeding the matrix with transport time using nativia.io API
	// NB: we will select "best" journey (The best journey if you have to display only one.)
	// NB: duration will be retreived in seconds. we will convert duration in minutes.

	//problematics: 
		// max request per minute: max request per month : 90000 / max 2 coordinates/request
		// => need to set up several keys

	// exemple de trajet départ arrivé
	// https://6e8bb014-7672-40a6-a747-143e75ced700@api.navitia.io/v1/journeys?from=-122.4752;37.80826&to=-122.402770;37.794682&datetime=20170407T120000

	
	//**********Building the function to get the transport time for one trajet********
	//test: OK

	function nativiaCall(trajet, batchNumber){
		console.log('nativiaCall called');
		const lonO=trajet.origin[0];
		const latO=trajet.origin[1];
		const lonD=trajet.destination[0];
		const latD=trajet.destination[1];
		selectToken(batchNumber)
		let nativiaToken = selectToken(batchNumber);
		console.log('nativiaToken:', nativiaToken);
		// let urlNativia = 'https://'+process.env.NATIVIA_TOKEN'@api.navitia.io/v1/journeys?from='+lonO+';'+latO+'&to='+lonD+';'+latD+'&datetime=20170407T120000';
		const urlNativia = 'https://'+nativiaToken+'@api.navitia.io/v1/journeys?from='+lonO+';'+latO+'&to='+lonD+';'+latD; 
		// console.log('urlNativia: ', urlNativia);
		let transportTimeMin = '';
		// return axios.get(urlNativia)
		// .then((response) => {
		// 	if(typeof response.data.journeys ==='undefined' || response.data.journeys === null){
		// 			console.log('response.data.error:', response.data.error);
		// 			transportTimeMin = '9999';
		// 			updateTrajetBis(trajet,transportTimeMin);
		// 		}
		// 		else {
		// 			// ('type:', response.data.journeys[0].type); to confirm we select the 'best' journey
		// 			const transportTime = response.data.journeys[0].duration;
		// 			transportTimeMin = Number.parseFloat(transportTime/60).toFixed(1)*10;
		// 			// transportTime is now in centaines de minutes
		// 			updateTrajetBis(trajet,transportTimeMin);
		// 		}
		// })
		// .catch((error)=> {
		// 	console.log('error when calling nativia API');
		// 	return error;
		// })
	}

	//********** Updating the trajet****************
	//test : OK

	function updateTrajetBis(trajet, transp){
		let query = {code:trajet.code};
		let updateDoc = {timeTransport:transp};
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


	//************Function for affecting token depending on batch number*************
	//parameter: batch number
	//returns : token
	//test : OK

	function selectToken(batchNumber){
  	let lastDigit = batchNumber % 10;
		console.log('The last digit of ', batchNumber, ' is ', lastDigit);
		switch (lastDigit) {
		  case 0:
		    // console.log('nativia token: ', process.env.NATIVIA_TOKEN0);
		    return process.env.NATIVIA_TOKEN0;
		    break;
		  case 1:
		    // console.log('nativia token: ', process.env.NATIVIA_TOKEN1);
		    return process.env.NATIVIA_TOKEN1;
		    break;
		  case 2:
		    // console.log('nativia token: ', process.env.NATIVIA_TOKEN2);
		    return process.env.NATIVIA_TOKEN2;
		    break;
		  default:
		    // console.log('nativia token: ', process.env.NATIVIA_TOKEN0);
		    return process.env.NATIVIA_TOKEN0;
		}
	}




export {
	mapboxGroupCall,
	mapboxGroupSave,
	updateTrajet,
	nativiaCall,
	updateTrajetBis,
	selectToken
};