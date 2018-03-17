import mongoose from 'mongoose';
import {Geometry,geometrySchema} from './geometry.js';

let Schema = mongoose.Schema;


let communeDestinationSchema = new Schema({
		destination: {
			name: {
				type: String,
				required: true
			},
			codeCommune : {
				type: String,
				required: true
			},
			geometry: geometrySchema
		},
		distanceToDestination: {
			distanceText: {
				type: String
			},
			distanceValue:{
				type: Number
			}
		},
		timeToDestination: {
			modeDriving : {
				timeText: {
					type: String
				},
				timeValue:{
					type: Number
				}
			},
			modeTransport :{
				timeText: {
					type: String
				},
				timeValue:{
					type: Number
				}
			}
		}
});

let CommuneDestination = mongoose.model('communeDestination', communeDestinationSchema);

export {
	CommuneDestination,
	communeDestinationSchema
};
