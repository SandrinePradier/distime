import mongoose from 'mongoose';

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
	coordonnees: { 
		type: Array,
    required: true
	},
	// [0] longitude
	// [1] latitude
	codeDepartment : {
		type: String,
		required: true
	}
});

// creation of a model based on our communeSchema
let Commune = mongoose.model('commune', communeSchema);

export {
	Commune,
	communeSchema
};

