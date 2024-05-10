import React, { useEffect, useRef, useState } from "react"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"


const socket = io.connect('http://192.168.100.67:4000')
function App() {
	const [connectedUser, setConnectedUser] = useState("")
	const [stream, setStream] = useState()
	const [receivingCall, setReceivingCall] = useState(false)
	const [caller, setCaller] = useState("")
	const [callerSignal, setCallerSignal] = useState()
	const [callAccepted, setCallAccepted] = useState(false)
	const [idToCall, setIdToCall] = useState("")
	const [callEnded, setCallEnded] = useState(false)
	const [name, setName] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef = useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
		 myVideo ?	myVideo.current.srcObject = stream : null
		})

		socket.on("connectedUser", (id) => {
      console.log('conneted user id ' + id);
			setConnectedUser(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		//when you want to call a specific user, you create new Peer connect for yourself for streaming
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
    //when the peer is on signal you can emit the callUser event to server
		peer.on("signal", (data) => {
      console.log('peer on signal event');
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: connectedUser,
				name: name
			})
		})
		peer.on("stream", (stream) => {
		 userVideo ? userVideo.current.srcObject = stream : null
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall = () => {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
		 userVideo ? userVideo.current.srcObject = stream : null
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}

	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>Call me</h1>
			<div className="container">
				<div className="video-container">
					<div className="video">
						{stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "500px" }} />}
					</div>
					<div className="video">
						{callAccepted && !callEnded ?
							<video playsInline ref={userVideo} autoPlay style={{ width: "500px" }} /> :
							null}
					</div>
				</div>
				<div className="myId">
					<input
						id="filled-basic"
						label="Name"
						variant="filled"
						value={name}
						onChange={(e) => setName(e.target.value)}
						style={{ marginBottom: "20px" }}
					/>
						<button variant="contained" color="primary">
							Copy ID
						</button>

					<input
						id="filled-basic"
						label="ID to call"
						variant="filled"
						value={idToCall}
						onChange={(e) => setIdToCall(e.target.value)}
					/>
					<div className="call-button">
						{callAccepted && !callEnded ? (
							<button variant="contained" color="secondary" onClick={leaveCall}>
								End Call
							</button>
						) : (
							<button color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
								call user
							</button>
						)}
						{idToCall}
					</div>
				</div>
				<div>
					{receivingCall && !callAccepted ? (
						<div className="caller">
							<h1 >{name} is calling...</h1>
							<button variant="contained" color="primary" onClick={answerCall}>
								Answer
							</button>
						</div>
					) : null}
				</div>
			</div>
		</>
	)
}

export default App
