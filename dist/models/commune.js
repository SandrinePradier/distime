'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Commune = undefined;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _geometry = require('./geometry.js');

var _communedestination = require('./communedestination.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

// creating Schema: it will define the structure of our data
var communeSchema = new Schema({
	name: {
		type: String,
		required: true
	},
	codeCommune: {
		type: String,
		required: true
	},
	department: {
		type: String,
		required: true
	},
	codeDepartment: {
		type: String,
		required: true
	},
	region: {
		type: String,
		required: true
	},
	codeRegion: {
		type: String,
		required: true
	},
	codesPostaux: {
		type: Array,
		required: true
	},
	geometry: _geometry.geometrySchema,
	destinations: _communedestination.communeDestinationSchema
});

// creation of a model based on our communeSchema
var Commune = _mongoose2.default.model('commune', communeSchema);

exports.Commune = Commune;