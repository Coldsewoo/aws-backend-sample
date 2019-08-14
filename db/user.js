const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username : {type: String, required: true},
  nickname: {type: String, required: true},
  avatar: {type: String, default : ""},
  email: {type: String, default : ""}
})

module.exports = mongoose.model("users", userSchema)