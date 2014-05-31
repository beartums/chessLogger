chessLogger
===========

Alpha Chess Analysis using Chess.js and ChessBoard.js

# Background

Back in 2006, I had a TREO.  It was okay, but it had a chess program that was great.  The engine 
was okay, but it really shone when used to record a game between 2 people.  When I upgreaded to 
a legitimate smart phone, I couldn't find anything as useful even though I've now downloaded 
about 30 chess apps in search of this holy grail.


# Features

* Standard graphical board with click and drag movement (thanks [oakmac](https://github.com/oakmac/chessboardjs)!)
* Disallow invalid moves (thanks [jhlywa](https://github.com/jhlywa/chess.js)
* Click on a move in the move list to reposition the board to that move
* Create analysis lines by making a different move when the board is not at the end of the move list
* Persist to a mongoDB database


# To Be Implemented

* Multiple Users with access to all games marked public or participated in
* Real-time playing over a network
* Analysis notation and commenting
* Set up a position to play from
* Import PGN files


# Installation

* Clone from ```https://github.com/beartums/chessLogger.git'''
* Run ```npm install``` and ```bower install```
* Edit ```config.json``` to add your default mongodb url (if you want game persistence)
* Enjoy