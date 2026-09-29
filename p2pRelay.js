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
function connectToPeer(peerId) {

    var connection = setupWebRTC(peerId);

    var channel = connection.createDataChannel("chat");

    channel.onopen = function() {
        console.log("WebRTC connected to " + peerId);
    };

    channel.onmessage = function(event) {
        console.log(
            "Received from " +
            peerId +
            ": " +
            event.data
        );
    };

    connection.createOffer()
        .then(function(offer) {
            return connection.setLocalDescription(offer);
        })
        .then(function() {

            socket.send(JSON.stringify({
                type: "webrtc_offer",
                target: peerId,
                offer: connection.localDescription
            }));

        });
}
