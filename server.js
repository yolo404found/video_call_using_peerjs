const express = require('express')
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const port = 4000

const app = express()
const server = createServer(app)
const io = new Server(server,{cors: {
    origin: "*",
    methods: [ "GET", "POST" ]
}})

app.get('/',(req,res)=>{
	return res.send('<h1>hello</h1>')
})

io.on('connection',(socket)=>{
    console.log('on connection');
   //when a user connect to socket server, the server will send the socket id for this user
	socket.emit("connectedUser",socket.id)

    // when a user disconnected, broadcasting an event except the sender
	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})

	//when the user is calling, the server will emit the event the userTocall 
	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	//when the user is accept the call, server will emit the event to caller
	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})

})

server.listen(4000, '192.168.100.67');

