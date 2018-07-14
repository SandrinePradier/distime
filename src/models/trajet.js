import mongoose from 'mongoose';
import {communeSchema} from './commune.js';


let Schema = mongoose.Schema;

let trajetSchema = new Schema({
		origin: communeSchema,
		destination: communeSchema,
		distance:{
			type: String
		},
		timeToDestinationDriving: {
			type: String
		},
		timeToDestinationTransport: {
			type: String
		}
});

let Trajet = mongoose.model('trajet', trajetSchema);

export {
	Trajet
};
