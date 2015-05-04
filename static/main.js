var socket = io.connect();
$( document ).ready(function() {
	var gamePlay = (function (){
		var mouseX, mouseY;
        var players = [];
        var score = 0;

        var init = function(){
        	if($('.game_timer'))
        	{
        		$('.game_timer').TimeCircles({
        			"start":true,
        		 	"count_past_zero": false,
        		 	"time": {
				        "Days": {
				            "text": "Days",
				            "color": "#40484F",
				            "show": false
				        },
				        "Hours": {
				            "text": "Hours",
				            "color": "#40484F",
				            "show": false
				        },
				        "Minutes": {
				            "text": "Minutes",
				            "color": "#40484F",
				            "show": true
				        },
				        "Seconds": {
				            "text": "Seconds",
				            "color": "#40484F",
				            "show": true
				        }
				    },
				    "animation": "ticks",
				    "bg_width": 0.25,
				    "fg_width": 0.08,
				    "circle_bg_color": "#005DFF"
        		}).addListener(function(unit, amount, total){
					if(total == 0) 
					{
						clear_score();
					}
				});
        	}

			$("#game_board").mousemove(function(e) {
			    send_mouse_position(e.pageX,e.pageY);
			}).mouseover();  
			socket.on('new_positions', function(coordinates){
            	show_player(coordinates);
        	});  
        	socket.on('new_game', function(){
        		resetTimer();
        	});
        	$(document).on("click",".player", function(player){
        		score++;
        		updateScore(player.target.id);
        	});
        	socket.on('decrement_score', function(player){
        		decrement_score(player.email);
        	});
        	// socket.on('remove_player', function(coordinates){
            // 		remove_player(coordinates);
        	// });
        };
        var clear_score = function () {
        	players = [];
        	$.ajax({
				type:"POST",
				data: {
					email:readCookie("email").replace("%40","@"),
					score: score
				},
				url: "http://localhost:1337/clear",
				success: function (response)
				{
					console.log(response);
					if(response == "top")
					{
						$('#modal-body').text("Great game! Your score for this round was " + score + ". That is your new top score!");
					}
					else if(response == "clear")
					{
						$('#modal-body').text("Great game! Your score for this round was " + score + ".");
					}
					else
					{
						$('#modal-body').text("Great game! Your score for this round was " + score + ". Sorry but we could not save your score, please re-login");
					}
					$('#finished').modal('show');
					score = 0;
				},
				error: function (response)
				{
					console.log(response);
				}
			});
        };
        var decrement_score = function(email) {
        	if(email == readCookie("email").replace("%40","@"))
        	{
        		score--;
        	}
        };
        var updateScore = function(player_id) {
        	var player_clicked = players[player_id].replace(".","@");
        	var player = readCookie("email").replace("%40","@");
        	var clicked = [];
        	clicked.push(player_clicked);
        	clicked.push(player);
        	socket.emit('update_score', clicked);
        };
        var send_mouse_position = function(x,y) {
        	coordinates = {"x":x, "y":y, "email": readCookie('email')};
        	socket.emit('send_mouse_position', coordinates);
        };
        var show_player = function(coordinates) {
        	coordinates.email = coordinates.email.replace("%40",".");
        	var index = $.inArray( coordinates.email, players)
        	if(index > -1)
        	{
        		$("#"+index).css({"top": coordinates.y, "left": coordinates.x});
        		$("#"+index).show();
        	}
        	else
        	{
        		players.push(coordinates.email);
        		$("#"+index).css({"top": coordinates.y, "left": coordinates.x});
        	}
        };
        //cookie manipulation code from http://www.quirksmode.org/js/cookies.html
        //author:  Scott Andrew
        var createCookie = function(name,value,days) {
			if (days) {
				var date = new Date();
				date.setTime(date.getTime()+(days*24*60*60*1000));
				var expires = "; expires="+date.toGMTString();
			}
			else var expires = "";
			document.cookie = name+"="+value+expires+"; path=/";
		}
        var readCookie = function(name) {
			var nameEQ = name + "=";
			var ca = document.cookie.split(';');
			for(var i=0;i < ca.length;i++) {
				var c = ca[i];
				while (c.charAt(0)==' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
			}
			return null;
		}
		var eraseCookie = function(name) {
			createCookie(name,"",-1);
		}
        return {
        	init: init
        };
    })();
	
	var credentials = (function (){
        var submit_register = $("#submit_register");
        var submit_login = $("#submit_login");
        var reg_link = $("#register_link");
        var log_link = $("#login_link");

        var init = function(){
        	submit_register.on("click",function(e){
        		e.preventDefault();
        		register();
        	});
        	submit_login.on('click', function(e){
        		e.preventDefault();
        		login();
        	});
        	reg_link.on('click', function(e){
        		e.preventDefault();
        		clear();
        		$("#register").show();
        		$("#login").hide();
        	});
        	log_link.on('click', function(e){
        		e.preventDefault();
        		clear();
        		$("#login").show();
        		$("#register").hide();
        	});       	
        };
        var register = function (){
        	$.ajax({
				type:"POST",
				data: {
					email:$("#email").val(),
					pass:$("#password").val()
				},
				url: "http://localhost:1337/register",
				success: function (response)
				{
					if(response == "success")
					{
						$("#register").children("label").addClass("has-success");
						$("#email").addClass("has-success");
						$("#password").addClass("has-success");
						setTimeout(function() {
							window.location.href = "http://localhost:1337/cursor_game";
						}, 1500);
					}
					else if(response == "taken")
					{
						error('reg_prob','Sorry that email is already registered to an account.');
					}
					else if(response == "email")
					{
						error('reg_prob','The email you entered is invalid.');
					}
					else if(response == "empty")
					{
						error('reg_prob','You must fill in both fields.');
					}
					else
					{
						error('reg_prob','Sorry, there was an eror on our end please try again.');
					}
				},
				error: function (response)
				{
					//oops
				}
			});
        };
        var login = function (){
        	$.ajax({
				type:"POST",
				data: {
					email:$("#email_login").val(),
					pass:$("#password_login").val()
				},
				url: "http://localhost:1337/login",
				success: function (response)
				{
					if(response == "valid")
					{
						$("#login").children("label").addClass("has-success");
						$("#email_login").addClass("has-success");
						$("#password_login").addClass("has-success");
						setTimeout(function() {
							window.location.href = "http://localhost:1337/cursor_game";
						}, 1500);
					}
					else if(response == "invalid")
					{
						error('log_prob','Sorry that email/password combination was invalid.');
					}
					else if(response == "email")
					{
						error('log_prob','The email you entered is invalid.');
					}
					else if(response == "empty")
					{
						error('log_prob','You must fill in both fields.');
					}
					else
					{
						error('reg_prob','Sorry, there was an eror on our end please try again.');
					}
				},
				error: function (response)
				{
					console.log(response);
				}
			});
        };
        var error = function (lor,message){
        	$("#" + lor).children("span").text(message);
        	$("#" + lor).show();
        	$('input').on('input',function(){
        		$("#" + lor).hide();
        	});
        };
        var clear = function (){
			$("#email").val("");
			$("#password").val("");
			$("#email_login").val("");
			$("#password_login").val("");
        };
        return {
        	init: init
        };
    })();
    

    credentials.init();
    if(window.location.pathname == "/cursor_game")
    {
    	gamePlay.init();
    }
});