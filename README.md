chessLogger
===========

Alpha Chess Analysis using Chess.js and ChessBoard.js

# Background

Back in 2006, I had a TREO.  The phone was cool at the time, but it had a chess program that was great.  The engine 
was okay, but it really shone when used to record a game between 2 people.  When I upgraded to 
a legitimate smart phone, I couldn't find anything as useful even though I've now downloaded 
about 30 apps in search of this holy grail.


# Features

* Standard graphical board with click and drag movement (thanks [oakmac](https://github.com/oakmac/chessboardjs)!)
* Disallow invalid moves (thanks [jhlywa](https://github.com/jhlywa/chess.js)!)
* Click on a move in the move list to reposition the board to that move
* Create analysis lines by making a different move when the board is not at the end of the move list
* Persist to a mongoDB database


# To Be Implemented

* Multiple Users with access to all games marked public or participated in
* Real-time playing over a network
* Analysis notation and commenting
* Set up a position to play from
* Import PGN files
* Enable Save to Local DB and upload when connected


# Notes

* For persisting games to the database, currently a JSON-capable REST api is expected.  
//(ServerUrl)/(DBName)/(CollectionName)/(ID) for a HTTP GET command.  I use the basic MongoRest 
Node.js project [here](https://github.com/beartums/mongoRest), borrowed from [tdegrunt](https://github.com/tdegrunt)
over [here](https://github.com/tdegrunt/mongodb-rest)

# Installation

* Clone the repo
* ```cd``` to the repo directory
* Run ```npm install``` and ```bower install```
* Edit ```chessLogger.js``` to add your default mongodb url, db name, and collection name
in the default settings in controller (if you want game persistence)
* run ```jsdoc -c jsdoc.json``` if you want the documentation (incomplete, and you must have jsdoc installed)
* Enjoy