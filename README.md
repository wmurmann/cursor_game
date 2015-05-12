Cursor Game is a small web app built on nodejs. It utilizes socket.io for real time gameplay between users. 
The object of the game is to click the opponents cursor, which to the user will seem as a ufo space ship, 
while not getting clicked by the opponent. Also the user must avoid asteroids that fly throught the gameboard.
The users scores as well as username and hashed/salted passwords are stored on a mongodb database. The sprites used by this
game are from Michael James Williams of tutsplus.com. The code is under GPL license.

To run the game on your system you will need:
1. mongo running globally, or you'll need to change the url to your external database's.
2. Change domain variable on the second line of main.js in the static folder, to whateve domain and port8000 you will be using.
   ie. localhost:8000
3. Change the port on the app.js page to the port your webpage will be ran on. ie. 8000, as seen above.


Feel free to message me if you have any question about the code.
