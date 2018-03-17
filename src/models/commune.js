import mongoose from 'mongoose';
import {Geometry,geometrySchema} from './geometry.js';
import {CommuneDestination,communeDestinationSchema} from './communedestination.js';

let Schema = mongoose.Schema;

// creating Schema: it will define the structure of our data
let communeSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	codeCommune : {
		type: String,
		required: true
	},
	department : {
		type: String,
		required: true
	},
	codeDepartment : {
		type: String,
		required: true
	},
	region : {
		type: String,
		required: true
	},
	codeRegion : {
		type: String,
		required: true
	},
	codesPostaux : {
		type: Array,
		required: true
	},
	geometry: geometrySchema,
	destinations: communeDestinationSchema
});

// creation of a model based on our communeSchema
let Commune = mongoose.model('commune', communeSchema);

export {Commune};

