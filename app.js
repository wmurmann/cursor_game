var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http');
var cookieParser = require('cookie-parser');
var validator = require('validator');
var bcrypt = require('bcrypt');

//set up the node server and pass it to the socket module
var server = app.listen(8000,function(){console.log('ready on port 1337');});
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
		score    : Number,
		top_score: Number
	},
	{ 
		collection : 'users' 
	});
var USER   = mongoose.model('users',user_schema);

//temporary fix xss warning
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//page rendering
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
app.get('/walkthrough',function (req,res) {
	if(req.cookies.email !== undefined)
	{
		res.render("walkthrough");	
	}
	else
	{
	    res.redirect("/");
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
//credentials
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
											score    : "0",
											top_score    : "0"
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
app.post('/clear', function (req,res){
	var email = req.body.email;
	var score = req.body.score;
	USER.findOneAndUpdate({email:email},{"score": 0}, {new:true}, 
		function (err,response)
		{
			if(err || !response)
			{
				res.send(response);
				return;
			}
			else if(response.top_score < score)
			{
				USER.findOneAndUpdate({email:email},{"top_score": score}, {new:true}, 
					function (err,response)
					{
						if(err || !response)
						{
							res.send("failed");
							return;
						}
						else
						{
							res.send("top");
						}
					}
				);
			}
			else
			{
				res.send("clear");
			}
		}
	);
});
app.post('/highscore', function (req,res){
	USER.find({}, 'email top_score', {sort: {top_score : -1}, limit:10}, function(err, users) {
		if (err) 
		{
			res.send("err")
		}
		if(!users.length)
		{
			res.send("none");
		}
		else
		{
			res.send(users);
		}
	});
});
//socket modules
io.sockets.on('connection', function(socket){ 

	socket.on('send_mouse_position', function(req) {  
		socket.broadcast.emit('new_positions', req);
	});
	//update scores from click events
	socket.on('update_score', function(req) {  
		console.log(req);
		USER.findOneAndUpdate({email:req[0]},{$inc: {"score": -1}}, {new:true}, 
			function (err,response)
			{
				if(err)
				{
					console.log(err);
					res.send("ERROR:Database");
					return;
				}
				if(!response)
				{
					console.log(response);
				}
				else
				{
					console.log(response);
					socket.broadcast.emit('decrement_score', req[0]);
				}
			}
		);
		USER.findOneAndUpdate({email:req[1]},{$inc: {"score": 1}}, {new:true}, 
			function (err,response)
			{
				if(err)
				{
					console.log(err);
					res.send("ERROR:Database");
					return;
				}
				if(!response)
				{
					console.log('updated');
				}
				else
				{
					console.log(response);
				}
			}
		);
	});
	//logs user out of system
	socket.on('log_out', function (req) {
		socket.broadcast.emit('remove_player', req);
	});
});