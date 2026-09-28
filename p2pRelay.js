<script>
    var angle = 0;

    function update() {
        angle += 0.1;
        document.body.style.setProperty("--angle", angle + "deg");
        requestAnimationFrame(update);
    }

    update();

    var nameScreen = document.getElementById("nameScreen");
    var nameInput = document.getElementById("nameInput");
    var joinButton = document.getElementById("joinButton");
    var chatScreen = document.getElementById("chatScreen");

    var myName = "";
    var hasJoined = false;

    var messages = document.getElementById("messages");
    var messageInput = document.getElementById("messageInput");
    var sendButton = document.getElementById("sendButton");
    var statusElement = document.getElementById("status");
    var usersElement = document.getElementById("users");

    var currentRoom = "main";
    var socket = null;
    var relayReady = false;
    var lobbyUsers = [];

    function updateUserList(users) {
        lobbyUsers = users.slice();

        usersElement.innerHTML = "";

        for (var i = 0; i < users.length; i++) {
            var user = document.createElement("div");

            user.className = "user";
            user.textContent = users[i].name || "Unknown";

            usersElement.appendChild(user);
        }
    }

    function addMessage(name, text, timestamp) {
        var div = document.createElement("div");

        div.className = "message";

        var header = document.createElement("div");
        header.className = "messageHeader";

        var nameSpan = document.createElement("span");
        nameSpan.className = "name";
        nameSpan.textContent = name;

        var timeSpan = document.createElement("span");
        timeSpan.className = "timestamp";

        timeSpan.textContent = timestamp
            ? new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "2-digit"
            }).format(new Date(timestamp))
            : "";

        header.appendChild(nameSpan);
        header.appendChild(timeSpan);

        var textSpan = document.createElement("div");
        textSpan.className = "messageText";
        textSpan.textContent = text;

        div.appendChild(header);
        div.appendChild(textSpan);

        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function systemMessage(text, timestamp) {
        var div = document.createElement("div");

        div.className = "message";
        div.style.color = "#777";

        var textSpan = document.createElement("span");
        textSpan.textContent = text;

        div.appendChild(textSpan);

        if (timestamp) {
            var timeSpan = document.createElement("span");

            timeSpan.className = "timestamp";
            timeSpan.textContent = new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "2-digit"
            }).format(new Date(timestamp));

            div.appendChild(timeSpan);
        }

        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    /*
     * Use the hostname/port supplied by Silly Development.
     *
     * IMPORTANT:
     * GitHub Pages is HTTPS, so the final version needs
     * wss:// rather than ws://.
     */

    var SERVER = "wss://217.154.36.84:7159";

    function connectToServer() {
        statusElement.textContent = "Connecting...";

        socket = new WebSocket(SERVER);

        socket.onopen = function() {
            console.log("Connected to server");

            socket.send(JSON.stringify({
                type: "join",
                room: currentRoom,
                name: myName
            }));
        };

        socket.onmessage = function(event) {
            var msg;

            try {
                msg = JSON.parse(event.data);
            }
            catch (err) {
                return;
            }

            console.log("Server:", msg);

            if (msg.type === "connected") {
                relayReady = true;

                statusElement.textContent = "Connected";

                systemMessage("You connected to the lobby.");

                return;
            }

            if (msg.type === "user_list") {
                updateUserList(msg.users || []);
                return;
            }

            if (msg.type === "user_joined") {
                if (msg.name) {
                    systemMessage(
                        msg.name + " joined the lobby.",
                        msg.timestamp
                    );
                }

                return;
            }

            if (msg.type === "user_left") {
                if (msg.name) {
                    systemMessage(
                        msg.name + " left the lobby.",
                        msg.timestamp
                    );
                }

                updateUserList(msg.users || []);

                return;
            }

            if (msg.type === "chat") {
                if (msg.senderId !== msg.myId) {
                    addMessage(
                        msg.name || "Unknown",
                        msg.text || "",
                        msg.timestamp
                    );
                }

                return;
            }

            if (msg.type === "error") {
                statusElement.textContent = "Server error";
                systemMessage(msg.detail || "Unknown server error.");
                return;
            }
        };

        socket.onclose = function() {
            relayReady = false;
            statusElement.textContent = "Disconnected.";

            systemMessage("Disconnected from server.");
        };

        socket.onerror = function() {
            relayReady = false;
            statusElement.textContent = "Connection error.";

            console.log("WebSocket connection error");
        };
    }

    function sendChat() {
        var text = messageInput.value.trim();

        if (text === "") {
            return;
        }

        if (!socket || socket.readyState !== WebSocket.OPEN || !relayReady) {
            systemMessage("Not connected yet.");
            return;
        }

        var message = {
            type: "chat_send",
            room: currentRoom,
            text: text,
            timestamp: Date.now()
        };

        addMessage(myName, text, message.timestamp);

        socket.send(JSON.stringify(message));

        messageInput.value = "";
        messageInput.focus();
    }

    sendButton.onclick = sendChat;

    messageInput.onkeydown = function(event) {
        if (event.key === "Enter") {
            sendChat();
        }
    };

    function joinLobby() {
        currentRoom = "main";
        relayReady = false;

        connectToServer();
    }

    function enterLobby() {
        var name = nameInput.value.trim();

        if (name === "") {
            nameInput.focus();
            return;
        }

        if (hasJoined) {
            return;
        }

        hasJoined = true;
        myName = name;

        nameScreen.style.display = "none";
        chatScreen.style.display = "flex";

        joinLobby();
    }

    joinButton.onclick = enterLobby;

    nameInput.onkeydown = function(event) {
        if (event.key === "Enter") {
            enterLobby();
        }
    };
</script>
