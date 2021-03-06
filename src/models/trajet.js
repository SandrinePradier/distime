import mongoose from 'mongoose';
import {communeSchema} from './commune.js';


let Schema = mongoose.Schema;

// let trajetSchema = new Schema({
// 		code: {
// 			type: String
// 		},
// 		origin: communeSchema,
// 		destination: communeSchema,
// 		distance:{
// 			type: String
// 		},
// 		timeToDestinationDriving: {
// 			type: String
// 		},
// 		timeToDestinationTransport: {
// 			type: String
// 		}
// });

let trajetSchema = new Schema({
		code: {
			type: String
			// ex: '5-48'
		},
		origin: {
			type: String
			//code insee commune
		},
		destination: {
			type: String
			//code insee commune
		},
		distance:{
			type: String
		},
		timeDriving: {
			type: String
		},
		timeTransport: {
			type: String
		}
});

let Trajet = mongoose.model('trajet', trajetSchema);

export {
	Trajet
};
