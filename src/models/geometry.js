import mongoose from 'mongoose';

let Schema = mongoose.Schema;

// creating Schema: it will define the structure of our data
//GEO JSON Schema
let geometrySchema = new Schema( {
	type : {
		type: String, 
		default: "Point"
	},
	coordinates : {
		type: Array, 
		required: true
	}
});

// creation of a model based on our geometrySchema
let Geometry = mongoose.model('geometry', geometrySchema);

export {
	Geometry,
	geometrySchema
};
