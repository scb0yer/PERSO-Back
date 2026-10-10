const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  classId: {type: mongoose.Schema.Types.ObjectId, ref: 'Classe', required: true, unique: true},
  revision: {type: Number, default: 0},
  periods: [{name: {type: String, required: true}, startWeek: {type: String, required: true}}],
  exclusions: [{_id: false, studentId: {type: String, required: true}, week: {type: String, required: true}}],
}, {timestamps: true});
module.exports = mongoose.model('TeacherSettings', schema);
