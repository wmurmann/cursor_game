var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http');
var cookieParser = require('cookie-parser');
var validator = require('validator');
var bcrypt = require('bcrypt');

//set up the node server and pass it to the socket module
var server = app.listen(1337,function(){console.log('ready on port 1337');});
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var io = require('socket.io')(server);

//sets up mongoose to talk to the pr2 database on th mongo server
//in order to run this code you must have a mongo server running globally on your computer
mongoose.connect('mongodb://localhost/pr2');
server.listen(3000);

//allows for easy access to files in views and static folders
app.set('view engine','ejs');
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/static"));
app.use(express.static(__dirname + "/bower_components"));
app.use(bodyParser());
app.use(cookieParser());





//schema to insert/update/delete a user document in the pr2 database under the users collection
var user_schema = new Schema(
	{ 
		email    : String, 
		password : String, 
		pos_x    : String,
		pos_y    : String,
		score    : String
	},
	{ 
		collection : 'users' 
	});
var USER   = mongoose.model('users',user_schema);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/',function (req,res) {
	if(req.cookies.email !== undefined)
	{
		res.redirect("/cursor_game");	
	}
	else
	{
	    res.render("credentials");
	}
});
app.get('/cursor_game',function (req,res) {
	if(req.cookies.email !== undefined)
	{
		res.render("cursor_game");	
	}
	else
	{
	    res.redirect("/");
	}
});
app.post('/register',function (req,res){
	var user_email    = validator.trim(req.body.email);
	var user_password = validator.trim(req.body.pass);
	if(user_email !== "" && user_password !== "")
	{
		if(validator.isEmail(user_email))
		{
			USER.find({email:user_email},'email',function (err, email) 
			{
				if (err) 
				{
					console.log(err);
					res.send("database");
					return;
				}
				else if(email.length == 0)
				{

					bcrypt.genSalt(10, function(err, salt) {
						bcrypt.hash(user_password, salt, function(err, hash) {
				            if (err) 
				            {
				            	console.log(err);
				            	res.send("database");
				            	return;
				            }
							else
							{
								var user = new USER({ 
											email    : user_email, 
											password : hash, 
											pos_x    : "-5000px",
											pos_y    : "-5000px",
											score    : "0"
							    });
								user.save(function (err) {
					                if (err) 
					                {
					                	console.log(err);
					                	res.send("database");
					                	return;
					                }
									else
									{
										res.cookie('email',user_email);
										res.send("success");
										return;
									}
								});
							}
						});
					});
				}
				else
				{
					res.send("taken");
				}

		    });
		}
		else
		{
			res.send("email");
			return;
		}
	}
	else
	{
		res.send("empty");
		return;
	}
});
app.post('/login', function (req,res){
	var user_email    = validator.trim(req.body.email);
	var user_password = validator.trim(req.body.pass);
	if(user_email !== "" && user_password !== "")
	{
		if(validator.isEmail(user_email))
		{
			USER.find(
				{email:user_email},
				'password',
				function (err,response)
				{
					if(err)
					{
						console.log(err);
						res.send("database");
						return;
					}
					try 
					{
						var password = response[0].password;
					}
					catch (e) {
						res.send("invalid");
						return;
					}
					bcrypt.compare(user_password, password, function(err, validity) {
						if(err)
						{
							console.log(err);
							res.send("database");
							return;
						}
						else if(validity == true)
						{
							res.cookie('email',user_email);
							res.send("valid");
							return;
						}
						else
						{
							res.send("invalid");
							return;
						}
					});
				}
			);
		}
		else
		{
			res.send("email");
		}
	}
	else
	{
		res.send("empty");
		return;
	}
});

//socket modules
io.sockets.on('connection', function(socket){ 
	socket.on('send_mouse_position', function(req) {  
		console.log(express.sid);
		socket.broadcast.emit('new_positions', req);
	});
	socket.on('disconnected', function() {
        socket.emit('remove_player', person_name);
    });
});
