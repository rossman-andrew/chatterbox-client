
class Application{

//intitalizer
constructor(url, username) {
    //this.username = getUrlVars();
    this.username;
    this.lastMessagetime = new Date().getTime(); //Date object of last message added
    this.server = url;
    this.getUrlVars();
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
                var username = msg.username;
                if(messageTime > app.lastMessagetime && app.username !== msg.username){
                    receiveMessage(msg.text, username);
                    app.lastMessagetime = messageTime; //Date object
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
        this.text = arg.text, this.message_side = arg.message_side, this.username = arg.username;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                $message.addClass(_this.message_side).find('.text').html(_this.text);
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
        getMessageText = function () {
            var $message_input;
            $message_input = $('.message_input');
            return $message_input.val();
        };
        receiveMessage = function(text, username) {
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
                username: username
            }); 
            message.draw();

            return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
        };
        sendMessage = function (text) {
            
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
                username: app.username
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
        setInterval(function() {
            app.fetch();
        }, 5000);


        $('.send_message').click(function (e) {
            return sendMessage(getMessageText());
        });
        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
                return sendMessage(getMessageText());
            }
        });
    });
}.call(this));