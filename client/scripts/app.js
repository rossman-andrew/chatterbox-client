
class Application{

//intitalizer
constructor(url, username) {
    //this.username = getUrlVars();
    this.username;
    this.roomname;
    this.currentRoomname = "AllChats";
    this.rooms = [];
    this.lastMessagetime = new Date().getTime(); //all chats object of last message added
    this.server = url;
    this.getUrlVars();
    //Prevent XSS Attacks
    this.entityMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
}

init() {

}

//Fetch all messages from server
fetch() {
    //Find the time stamp of 30 minutes ago.
    var minsAgo = new Date( (new Date()).getTime() - 1000 * 300 ).toISOString(); //5 minutes
    console.log(minsAgo);
    var timeData = 'where={"createdAt":{"$gte":{"__type":"Date","iso":"' + minsAgo + '"}}}';
    var app = this;
    
    $.ajax({
        // This is the url you should use to communicate with the parse API server.
        url: app.server,
        type: 'GET',
        data: timeData, //Where the time created is no longer thatn 30 minutes ago, if there are more than 100 messages in 30 minutes, we will ge the latest 30.
        contentType: 'application/json',
        success: function (data) {
            //Display messages to dom
            console.log('Messages recieved');
            console.log(data);
            var results = data.results;
            for (var msg of results) {
                //Compare the time of the message,
                var messageTime = Date.parse(msg.createdAt);

                //Grab the username
                var username = msg.username;

                //Grab the roomname
                var roomname = msg.roomname;

                //Iterate over every message
                if(messageTime > app.lastMessagetime && app.username !== msg.username){
                    receiveMessage(app.escapeHtml(msg.text) , app.escapeHtml(username), app.escapeHtml(roomname)); //Add message to chat block
                    app.lastMessagetime = messageTime; //Set last date time

                    if(!app.rooms.includes(roomname) && roomname !== undefined && roomname !== null){
                        app.rooms.push(roomname); //Push to rooms array
                        addRoomname(roomname); //Add roomname div to drop drop menu
                    }
                    
                }
                
            }
        },
        error: function (data) {
            // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
            console.error('chatterbox: Failed to recieve messages', data);
        }
    });
}


//Send Message to server
send(message) {
    var app = this;
    $.ajax({
        // This is the url you should use to communicate with the parse API server.
        url: this.server,
        type: 'POST',
        data: JSON.stringify(message),
        contentType: 'application/json',
        success: function (data) {
            console.log('chatterbox: Message sent');
            app.lastMessagetime = new Date().getTime();
        },
        error: function (data) {
            // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
            console.error('chatterbox: Failed to send message', data);
        }
    });
}

//Get the username from the url 
getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    this.username =  vars["username"];
}

//Clear the messages from the dom
clearMessages() {
    $('#chats').empty();
}



escapeHtml(string) {
    var app = this;
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return app.entityMap[s];
    });
}

unicodeToChar(text) {
   return text.replace(/\\u[\dA-F]{4}/gi, 
          function (match) {
               return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
          });
}

renderMessage(){
    var text = escapehtml(text);
    $("#chats").append("<p> ($message['username']): ($message[text]) </p>");
}

renderRoom(){
    $("#roomSelect").append("<p></p>");
}

}

const app = new Application("http://parse.sfm8.hackreactor.com/chatterbox/classes/messages");
console.log(app);


(function () {
    var Message;
    Message = function (arg) {
        this.text = arg.text, this.message_side = arg.message_side, this.username = arg.username, this.roomname = arg.roomname;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                $message.addClass(_this.message_side).find('.text').html(_this.text);
                $message.addClass(this.roomname)
                console.log(this.username);
                $message.find('.username').html(this.username);
                $('.messages').append($message);

                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };
    $(function () {
        var getMessageText, message_side, sendMessage;
        message_side = 'right';

        //Create All Chats button
        var $allChats = $("<a>", {class: "dropdown-item dropdown_template allChats", href: "#"});
            $allChats.text('All Chats');
            $allChats.click(function(){ 
                $('.message').show();
                $('.title').text('All Chats');});
            $('.dropdown-menu').append($allChats);

        getMessageText = function () {
            var $message_input;
            $message_input = $('.message_input');
            return $message_input.val();
        };

        //Add new roomname
        addRoomname = function (roomname) {
            // $(".dropdown-menu").append("<a></a>")
            var $roomname;
            var $tag = $("<a>", {class: "dropdown-item dropdown_template"});
            $tag.text(roomname);
            
            //Add click function to new roomname in dropdown menu
            $tag.click(function(){ 
                console.log(roomname);
                
                //Change the title of the chat window to current chat room
                $('.title').text(roomname);

                //Set Current room to the roomname
                app.currentRoomname = roomname;

                //Hide all messages that are not apart of the current room
                filterRooms(roomname);
            });

            $('.dropdown-menu').append($tag);
        };

        filterRooms = function (roomname) {
            $("ul.messages").children("li.message").each(function () {
                console.log()

                if (!($(this).hasClass(roomname))) {
                    console.log('This element contains the room name and should be hidden');
                    $(this).hide();
                }else{
                    console.log('The element does not contain the class name ', roomname);
                }
            });
                //$("ul.messages").children().hasClass(roomname);
            
        }

        receiveMessage = function (text, username, roomname) {
            console.log('receive was called');
            var $messages, message;
            if (text.trim() === '') {
                return;
            }
            //$('.message_input').val('');
            $messages = $('.messages');
            message_side = 'left';
            message = new Message({
                text: text,
                message_side: message_side,
                username: username,
                roomname: roomname

            });
            message.draw();

            return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
        };
        sendMessage = function (text, roomname) {

            var $messages, message;
            if (text.trim() === '') {
                return;
            }
            $('.message_input').val('');
            $messages = $('.messages');
            message_side = 'right';
            message = new Message({
                text: text,
                message_side: message_side,
                username: app.username,
                roomname: roomname
            });
            message.draw();

            //Create message object
            var userMessage = {
                username: app.username,
                text: text,
                roomname: 'BOSSES'
            }
            app.send(userMessage);

            return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
        };

        //Call the fetch function every 5 seconds
        setInterval(function () {
            app.fetch();
        }, 5000);


        $('.send_message').click(function (e) {
            return sendMessage(getMessageText(), app.currentRoomname);
        });
        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
                return sendMessage(getMessageText(), app.currentRoomname);
            }
        });
    });
}.call(this));