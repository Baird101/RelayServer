var peerConnections = {};

function setupWebRTC(peerId) {
    var connection = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            }
        ]
    });

    peerConnections[peerId] = connection;

    connection.onicecandidate = function(event) {
        if (event.candidate) {
            socket.send(JSON.stringify({
                type: "webrtc_ice",
                target: peerId,
                candidate: event.candidate
            }));
        }
    };

    connection.ondatachannel = function(event) {
        var channel = event.channel;

        channel.onmessage = function(event) {
            console.log("WebRTC message:", event.data);
        };
    };

    return connection;
}
