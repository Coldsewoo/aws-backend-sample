const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  username : {type: String, default: "Anonymous"},
  message: {type: String, required: true}
})

module.exports = mongoose.model("messages", messageSchema)