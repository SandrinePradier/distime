import mongoose from 'mongoose';
import request from 'request';
import Bottleneck from 'bottleneck';

import {Commune} from './models/commune.js';
import {Trajet} from './models/trajet.js';


const limiter = new Bottleneck({
  minTime: 1000
});

// HELPERS for 3RD STEP *******************************************************
//TO BE TESTED AGAIN!


//MAPBOX API

	//feeding the matrix with distance and driving time using mapbox API
	//NB: distance will be retreived in meter, and duration in seconds. 
	//we will convert distance in :
	//distanceTrajetKm in km*10, and duration in minutes*10

	//problematics: 
		// max request per minute: 60 / max request per month : 50000 / max 25 coordinates/request
	//call enable to provide one source / with 24 destinations

	//***********Getting the distance and driving time for one trajet: OK***********

//=> envisager une source / several destinations:
// ex: https://api.mapbox.com/directions-matrix/v1/mapbox/walking/-122.418563,37.751659;-122.422969,37.75529;-122.426904,37.759617?sources=1&annotations=distance,duration&access_token=pk.eyJ1Ijoic2FuZHJpbmVwcmFkaWVyIiwiYSI6ImNqajJ3MWo3dDBwcHMzcXBnNWUydzZueGMifQ.9IdBegXkVdwugY4k5N3nPQ


	function mapboxCall(trajet){
		console.log('mapboxCall called');
		const lonO=trajet.origin[0];
		const latO=trajet.origin[1];
		const lonD=trajet.destination[0];
		const latD=trajet.destination[1];
		const urlMapbox = 'https://api.mapbox.com/directions/v5/mapbox/driving/'+lonO+'%2C'+latO+'%3B'+lonD+'%2C'+latD+'.json?access_token='+process.env.MAPBOX_TOKEN
		let drivingTimeMin = '';
		let distanceTrajetKm = '';
		limiter.submit(request, urlMapbox, (error, response, body) => {
			if(error){
				console.log('error when calling mapbox API');
			}
			else{
				const jsonBody = JSON.parse(body);
				const drivingTime = jsonBody.routes[0].duration;
				drivingTimeMin = drivingTime/60;
				// drivingTimeMin = Number.parseFloat(drivingTime*10/60).toFixed(0);
				console.log('drivingTimeMin:', drivingTimeMin);
				const distanceTrajet = jsonBody.routes[0].distance;
				distanceTrajetKm = distanceTrajet/1000;
				// distanceTrajetKm = Number.parseFloat(distanceTrajet*10/1000).toFixed(0);
				console.log('distanceKM:', distanceTrajetKm);
				updateTrajet(trajet,distanceTrajetKm,drivingTimeMin);
			}
		})
	}


	//**************Updating the trajet with the distance and driving time: OK***********

	// AModel.findOneAndUpdate(conditions, update, options, callback)
	// options : specify upsert : true => if object not created, it will create it.
	function updateTrajet(trajet, dist, drive){
		const query = {code:trajet.code};
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



//nativia.io API

	// feeding the matrix with transport time using nativia.io API
	// NB: we will select "best" journey (The best journey if you have to display only one.)
	// NB: duration will be retreived in seconds. we will convert duration in minutes.

	// exemple de trajet départ arrivé
	// https://6e8bb014-7672-40a6-a747-143e75ced700@api.navitia.io/v1/journeys?from=-122.4752;37.80826&to=-122.402770;37.794682&datetime=20170407T120000


	//**********Building the function to get the transport time for one trajet: OK********

	function nativiaCall(trajet){
		console.log('nativiaCall called');
		const lonO=trajet.origin[0];
		const latO=trajet.origin[1];
		const lonD=trajet.destination[0];
		const latD=trajet.destination[1];
		// let urlNativia = 'https://'+process.env.NATIVIA_TOKEN'@api.navitia.io/v1/journeys?from='+lonO+';'+latO+'&to='+lonD+';'+latD+'&datetime=20170407T120000';
		const urlNativia = 'https://'+process.env.NATIVIA_TOKEN+'@api.navitia.io/v1/journeys?from='+lonO+';'+latO+'&to='+lonD+';'+latD;
		let transportTimeMin = '';
		request(urlNativia, (error, response, body)=>{
			if (error){
				console.log('error when calling api nativia');
			}
			else{
				const bodyjson = JSON.parse(body);
				// console.log('bodyjson:', bodyjson);
				if(typeof bodyjson.journeys ==='undefined' || bodyjson.journeys === null){
					console.log('bodyjson.error:', bodyjson.error);
					transportTimeMin = '9999';
					updateTrajetBis(trajet,transportTimeMin);
				}
				else {
					console.log('type:', bodyjson.journeys[0].type);
					const transportTime = bodyjson.journeys[0].duration;
					transportTimeMin = transportTime/60;
					// transportTimeMin = Number.parseFloat(transportTime*10/60).toFixed(0);
					console.log('transportTimeMin:', transportTimeMin);
					updateTrajetBis(trajet,transportTimeMin);
				}
			}
		})
	}

	//********** Updating the trajet: OK****************

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






export {
	mapboxCall,
	updateTrajet,
	nativiaCall,
	updateTrajetBis
};