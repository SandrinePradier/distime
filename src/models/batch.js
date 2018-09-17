import mongoose from 'mongoose';

let Schema = mongoose.Schema;

// creating Schema: it will define the structure of our data
let batchSchema = new Schema({
	batchName : {
		type: Number,
		required: true
	},
	communesIndex: { 
		type: Array,
   	required: true
	},
	status : {
		//Status: 'Done'/ 'ToDo' / 'InProcess'
		type: String,
		required: true
	}
});

// creation of a model based on our communeSchema
let Batch = mongoose.model('batch', batchSchema);

export {
	Batch,
	batchSchema
};