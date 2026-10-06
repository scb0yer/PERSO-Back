const mongoose=require('mongoose');
// Sous-document partagé, pas une collection supplémentaire.
module.exports=new mongoose.Schema({
 week:String,endDay:String,
 pointsTenths:{type:Number,min:0},targetTenths:{type:Number,min:1},
 percentage:{type:Number,min:0,max:100},rawPercentage:Number,gradeOn20:Number,
},{_id:false});
