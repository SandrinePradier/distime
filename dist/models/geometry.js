'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.geometrySchema = exports.Geometry = undefined;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

// creating Schema: it will define the structure of our data
//GEO JSON Schema
var geometrySchema = new Schema({
	type: {
		type: String,
		default: "Point"
	},
	coordinates: {
		type: Array,
		required: true
	}
});

// creation of a model based on our geometrySchema
var Geometry = _mongoose2.default.model('geometry', geometrySchema);

exports.Geometry = Geometry;
exports.geometrySchema = geometrySchema;