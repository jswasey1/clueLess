/*------------------------------------------------------------------------------------------------------------------------------------------
Notes:

    AH: 05/03/2018
        - Cleaned up code - took out unnecessary junk from tutorial 
        - Added Deck / Cards features for dealing - Currently displays the cards each players holds in there personal notebook
 

JS: 05/06/18
	- test

-----------------------------------------------------------------------------------------------------------------------------------------*/

//app.js

var playerId = 0;
var express = require('express');
var app = express();
var serv = require('http').Server(app);
 
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));
 
serv.listen(2000);
console.log("Server started.");
 
var SOCKET_LIST = {};  
  
//NOTE: activePlayers - not sure how to get around hard coding this because there is currently no lobby. 
//      When players join they enter straight into game without knowing how many others will join. 
//      I'm cool with hardcoding this for simplicity sake

var activePlayers = 4;
 
 
/*------------------------------------------------------------------------------------------------------------------------------------------
Begining: Deck / Cards

AH: Work in progress 
        - Wasnt exactly sure where to add this but i think it needs to be on the server side so players dont get dealt the same cards

-----------------------------------------------------------------------------------------------------------------------------------------*/
var suspectCards = ["suspect1", "suspect2", "suspect3", "suspect4", "suspect5", "suspect6"];
var weaponCards = ["weapon1", "weapon2", "weapon3", "weapon4", "weapon5", "weapon6"];
var roomCards = ["room1", "room2", "room3", "room4", "room5", "room6", "room7", "room8", "room9"]; 

var caseFile=[], deck=[], playersCards = [player1Cards=[], player2Cards=[], player3Cards=[], player4Cards=[], player5Cards=[], player6Cards=[]];
 
   shuffle = function(cards){
        var curIndex = cards.length, tempValue, randomIndex;
            while (0 !== curIndex) {
                randomIndex = Math.floor(Math.random() * curIndex);
                curIndex -= 1;
                tempValue = cards[curIndex];
                cards[curIndex] = cards[randomIndex];
                cards[randomIndex] = tempValue;
            }
	}
    pullCaseFileCard = function(cards){
         var caseFileCard = cards.pop();
	 caseFile.push(caseFileCard);
    }
    getCards = function(curPlayer){
        return playersCards[curPlayer-1];
    } 
    dealCards = function(activePlayers){
        shuffle(suspectCards);
        shuffle(weaponCards);
        shuffle(roomCards);	

        pullCaseFileCard(suspectCards);
        pullCaseFileCard(weaponCards);
        pullCaseFileCard(roomCards); 
        
        deck = suspectCards.concat(weaponCards, roomCards);  //formDeck     
        shuffle(deck);
        
        while (deck.length !== 0) {
            for(var i = 0; i < activePlayers; i++) {
                var x = deck.pop();  
                playersCards[i].push(x);
            }
        }  
    }      
  
    dealCards(activePlayers); 
/*------------------------------------------------------------------------------------------------------------------------
End: Deck / Cards
------------------------------------------------------------------------------------------------------------------------*/


/*------------------------------------------------------------------------------------------------------------------------------------------
Begining: Room / Gameboard

JC: Work in progress 
        - Navigating the gameboard with hardcoded values. Not great, but It'll work.
		- Made a new gameboard to follow professor instructionsa

-----------------------------------------------------------------------------------------------------------------------------------------*/
// var gameboardRooms = ["Study", "Hall", "Lounge", "Library", "Billiards", "Dining", "Conservatory", "Ballroom", "Kitchen"]
// var gameboardHallways = ["StudyToHall", "HallToLounge", "LoungeToDining", "DiningToKitchen",
						 // "KitchenToBallroom", "BallroomToConservatory", "ConservatoryToLibrary", 
						 // "LibraryToStudy", "BilliardsToLibrary", "BilliardsToHall", "BilliardsToDining",
						 // "BilliardsToBallroom", "SPConservatoryToLounge", "SPKitchenToStudy"]

// var coordinateSystem = function(gameboardRooms, gameboardHallways){
		// gameboardRooms.Study = (0,0);
		// gameboardHallways.StudyToHall (5,0)
		// gameboardRooms.Hall = (10,0);
		// gameboardRooms.Lounge = (10,0);
 // }

/*------------------------------------------------------------------------------------------------------------------------
End: Rooms/Hallways/Movement
------------------------------------------------------------------------------------------------------------------------*/

    
var Player = function(id){
    var self = {
        x:47,
        y:25,
        spdX:0,
        spdY:0,
        id:id,
        cardsInHand: getCards(id),
        number:"" + Math.floor(10 * Math.random()),  
        pressingRight:false,
        pressingLeft:false,
        pressingUp:false,
        pressingDown:false,
        maxSpd:10,
    }

    self.update = function(){
		self.updateSpd();
        self.updatePosition();
    }
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }

	self.getLocation = function(){
		location = [self.x,self.y];
		return location;
	}
	
    self.updateSpd = function(){
		self.spdX = 0;
		self.spdY = 0;     
    }
   //send to player
    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            cardsInHand:self.cardsInHand, 
        };     
    }
    // send updates only
    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y, 
            cardsInHand:self.cardsInHand, 
        }  
    }
   
    Player.list[id] = self;
   
    initPack.player.push(self.getInitPack());
    return self;
}
 
Player.list = {};
Player.onConnect = function(socket){
    var player = Player(socket.id);
    socket.on('keyPress',function(data){  
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
    });
       
    socket.emit('init',{
        selfId:socket.id,
        player:Player.getAllInitPack(), 
    })
}
Player.getAllInitPack = function(){
    var players = [];
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}

Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}

Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());     
    }
    return pack;
}

Player.move = function(data){
    var pack = [];
	var player = Player.list[data.playerId];
	player.x = data.x;
	player.y = data.y;
	pack.push(player.getUpdatePack());
    return pack;
}


var DEBUG = true;

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){ // when  a player connects this function is called
    playerId += 1;
    socket.id = playerId;
    SOCKET_LIST[socket.id] = socket;
   
   socket.on('signIn',function(data){
        Player.onConnect(socket);    // creates a new player depending on id
        socket.emit('signInResponse',{success:true});
    });
   
    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect;
    });
    
    socket.on('sendMsgToServer',function(data){
        var playerName = ("" + socket.id).slice(2,7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data); 
        }
    });
   
    socket.on('evalServer',function(data){
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer',res);     
    });
    
    //////SUGESTION
     socket.on('suggest',function(data){  
        SOCKET_LIST[data.playerResponding].emit('askSuggestion',{playerSuggesting:data.playerSuggesting, playerResponding:data.playerResponding, cardsSubmitted:data.cardsSubmitted});
    });
    
    socket.on('suggestResponse',function(data){  
        SOCKET_LIST[data.playerSuggesting].emit('suggestResponseCard',{playerSuggesting:data.playerSuggesting, playerResponding:data.playerResponding, cardToShow:data.cardsSubmitted});
    });

	
	//////Move
	socket.on('updatePosition', function(data){
		var pack = {
			player:Player.move(data),
		}
		for (var i in SOCKET_LIST){
			var socket = SOCKET_LIST[i];
			socket.emit('updatePosition',pack);
		}		
    });
});

var initPack = {player:[]};
var removePack = {player:[]};

setInterval(function(){
       var pack = {
        player:Player.update(),
	}
	
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('updatePosition',pack);
		socket.emit('remove',removePack);
	}
	initPack.player = []; 
	removePack.player = []; 
	
},1000/25);

 
 