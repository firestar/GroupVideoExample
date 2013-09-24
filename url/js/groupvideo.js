var GroupVideo = {
    sock:null,
    name:"guest",
    toggle_v:"pause",
    chathover: false,
    owner:"",
    videoID: "",
    
    // Start of callback functions
    messageSent: function(name,message){},
    sessionAccepted: function(){},
    connected: function(){},
    loadVideo: function(video){
        GroupVideo.finalLoadVideo(video);
    },
    userName: function(){},
    userAccepted: function(){},
    userDenied: function(){},
    groupsRecieved: function(groups){},
    newOwner: function(name,cowner){},
    // End of callback functions
    
    finalLoadVideo: function(video){
    	document.getElementById(GroupVideo.videoID).src=video['movie_url'];
    	document.getElementById(GroupVideo.videoID).type=video['type'];
        document.getElementById(GroupVideo.videoID).play();
    },
    sendMessage: function(text){
        GroupVideo.sock.send($.toJSON({"action":"message","text":text}));
    },
    userSet: function(){
        GroupVideo.sock.send($.toJSON({"action":"login","name":GroupVideo.name}));
    },
    join: function(name){
        GroupVideo.sock.send($.toJSON({"action":"group_join","name":name}));
    },
    load: function(movie_url,title){
        GroupVideo.sock.send($.toJSON({"action":"load","movie_url":movie_url,"title":title}));
    },
    played: function(){
        GroupVideo.sock.send($.toJSON({"action":"user_action","video":"play"}));
    },
    paused: function(){
        GroupVideo.sock.send($.toJSON({"action":"user_action","video":"pause"}));
    },
    seeked: function(time){
        GroupVideo.sock.send($.toJSON({"action":"user_action","video":"seek","time":time}));
    },
    buffering: function(){
        GroupVideo.sock.send($.toJSON({"action":"user_action","video":"buffering"}));
    },
    init: function(server,videoID,name){
        GroupVideo.name = name;
        GroupVideo.videoID = videoID;
        GroupVideo.sock = new WebSocket('ws://'+server+'/');
        GroupVideo.sock.onopen = function () {
            GroupVideo.connected();
        };
        GroupVideo.sock.onmessage = function (event) {
            GroupVideo.process(jQuery.parseJSON(event.data));
        };
        document.getElementById(GroupVideo.videoID).addEventListener("timeupdate", function () {
            curr_time = document.getElementById(GroupVideo.videoID).currentTime;
        });
        document.getElementById(GroupVideo.videoID).addEventListener("seeked", function () {
            GroupVideo.seeked(document.getElementById(GroupVideo.videoID).currentTime);
        });
        document.getElementById(GroupVideo.videoID).addEventListener("pause", function () {
            GroupVideo.paused();
        });
        document.getElementById(GroupVideo.videoID).addEventListener("play", function () {
            GroupVideo.played();
        });
        document.getElementById(GroupVideo.videoID).addEventListener("stalled", function () {
            GroupVideo.buffering();
        });
    },
    process: function(json){
        switch(json['action']){
            case "message":
                GroupVideo.messageSent( json['name'], json['text'] );
            break;
            case "user_nick":
            	GroupVideo.userName();
            break;
            case "user_accepted":
                GroupVideo.userAccepted();
                GroupVideo.sock.send($.toJSON({"action":"group_list"}));
            break;
            case "new_owner":
                GroupVideo.owner=json['name'];
                if(GroupVideo.owner==GroupVideo.name){
                    GroupVideo.sessionAccepted(GroupVideo.owner,true);
                }else{
                    GroupVideo.sessionAccepted(GroupVideo.owner,false);
                }
            break;
            case "play":
                if(GroupVideo.owner != GroupVideo.name){
                    document.getElementById(GroupVideo.videoID).play();
                }
            break;
            case "pause":
                if(GroupVideo.owner != GroupVideo.name){
                    document.getElementById(GroupVideo.videoID).pause();
                }
            break;
            case "seek":
                if(GroupVideo.owner != GroupVideo.name){
                    document.getElementById(GroupVideo.videoID).currentTime=json['time'];
                    document.getElementById(GroupVideo.videoID).play();
                }
            break;
            case "pulse":
                GroupVideo.sock.send($.toJSON({"action":"return_pulse","time":document.getElementById(GroupVideo.videoID).currentTime}));
            break;
            case "load":
                GroupVideo.loadVideo(json);
            break;
            case "group_list":
                GroupVideo.groups = json['groups'];
                GroupVideo.groupsRecieved(json['groups']);
            break;
            case "accept":
                GroupVideo.sessionAccepted();
            break;
            case "user_denied":
                GroupVideo.userDenied();
            break;
        }
    }
};