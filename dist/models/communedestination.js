'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.communeDestinationSchema = exports.CommuneDestination = undefined;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _geometry = require('./geometry.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;

var communeDestinationSchema = new Schema({
	destination: {
		name: {
			type: String,
			required: true
		},
		codeCommune: {
			type: String,
			required: true
		},
		geometry: _geometry.geometrySchema
	},
	distanceToDestination: {
		distanceText: {
			type: String
		},
		distanceValue: {
			type: Number
		}
	},
	timeToDestination: {
		modeDriving: {
			timeText: {
				type: String
			},
			timeValue: {
				type: Number
			}
		},
		modeTransport: {
			timeText: {
				type: String
			},
			timeValue: {
				type: Number
			}
		}
	}
});

var CommuneDestination = _mongoose2.default.model('communeDestination', communeDestinationSchema);

exports.CommuneDestination = CommuneDestination;
exports.communeDestinationSchema = communeDestinationSchema;