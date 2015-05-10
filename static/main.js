var socket = io.connect();
var domain = "spacechase.tk";
$( document ).ready(function() {
	var gamePlay = (function (){
		var mouseX, mouseY;
        var players = [];
        var score = 0;
        var stop_asteroids = false;

        var init = function(){
        	start_timer();
			start_asteroids();
        	$("#new_game").click(function (){
        		$('#finished').modal("hide");
        	});
        	$("#finished").on('hidden.bs.modal', function () {
			    new_game();
			});
			$("#highscore_table").on('hidden.bs.modal', function () {
			    new_game();
			});
			$(".highscore").on("click", function () {
				high_scores();
				if($("#finished").is(":visible"))
				{
					$('#finished').hide();
				}
			});
        	$(".log_out").click(function () {
        		socket.emit('log_out', readCookie("email").replace("%40","@"));
        		log_out(false);
        	});
        	window.onbeforeunload = function(e) {
				socket.emit('log_out', readCookie("email").replace("%40","@"));
			};
			$("#game_board").mousemove(function(e) {
			    send_mouse_position(e.pageX,e.pageY);
			}).mouseover(); 
			$(document).on("click",".player", function(player){
        		updateScore(player.target.id);
        	});
			$(".asteroid").mouseover(function() {
				decrease_score_color();
			});
			socket.on('new_positions', function(coordinates){
            	show_player(coordinates);
        	});  
        	socket.on('new_game', function(){
        		resetTimer();
        	});
        	socket.on('decrement_score', function(player){
        		decrement_score(player);
        	});
        	socket.on('remove_player', function(email){
            	remove_player(email);
        	});
        };
        var move_asteroid = function(asteroid)
        {
        	if(!stop_asteroids)
        	{
        		coordinates = rand_spots();
	        	asteroid.css({"top": coordinates.start_y, "left": coordinates.start_x});
	        	asteroid.show();
	        	asteroid.animate({top: coordinates.target_y, left: coordinates.target_x}
	        		,Math.random() * (5000 - 2000) + 2000, 
	        		function(){
		        		asteroid.hide(function(){
		        			move_asteroid(asteroid);
		        		});
	        	});
        	}
        };
        var start_asteroids = function()
        {
        	stop_asteroids = false;
        	setTimeout(move_asteroid($("#a1")), 500);
        	setTimeout(move_asteroid($("#a2")), 750);
        	setTimeout(move_asteroid($("#a3")), 1000);
        	setTimeout(move_asteroid($("#a4")), 1250);
        	setTimeout(move_asteroid($("#a5")), 1500);
        };
        var rand_spots = function()
       	{
       		var sides = [1,2,3,4],spots = {},
			start_side = sides.splice(Math.random()*sides.length,1),
			stop_side = sides.splice(Math.random()*sides.length,1);

			for(var i = 0; i < 2; i++)
			{
				var x,y;
				if(i == 0)
				{
					var side = start_side;
				}
				else
				{
					var side = stop_side;
				}
				if(side == 1)
				{
					x = Math.random() * ($(window).width() - 0) + 0;
					y = -72;
				}
				else if(side == 2)
				{
					x = $(window).width() + 72;
				    y = Math.random() * ($(window).height() - 0) + 0;
				}
				else if(side == 3)
				{
					x = Math.random() * ($(window).width() - 0) + 0;
				    y = $(window).height() + 72;
				}
				else
				{
					x = -72;
					y = Math.random() * ($(window).height() - 0) + 0;
				}
				if(i == 0)
				{
					spots.start_x = x + "px";
					spots.start_y = y + "px";
				}
				else
				{
					spots.target_x = x + "px";
					spots.target_y = y + "px";
				}
			}
			return spots;
       	};
        var log_out = function (leaving_site) {
        	eraseCookie("email");
	        window.location.href = "http://"+domain+"/";
        };
        var remove_player = function(email) {
        	email = email.replace("@",".");
        	var index = $.inArray( email, players);
        	players[index] = "";
        	$('#'+index).hide();
        };
        var new_game = function () {
        	$('.game_timer').TimeCircles().restart();
        	$('#finished').modal("hide");
        	for(var i = 0; i < 100; i++)
        	{
        		$("#"+i).removeClass('hide_player');
        	}
        	start_asteroids();
        };
        var start_timer = function () {
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
				            "color": "rgb(249,47,8)",
				            "show": true
				        },
				        "Seconds": {
				            "text": "Seconds",
				            "font": "Press Start 2P",
				            "color": "rgb(249,47,8)",
				            "show": true
				        }
				    },
				    "animation": "ticks",
				    "bg_width": 0.25,
				    "fg_width": 0.08,
				    "circle_bg_color": "rgb(60, 60, 60)"
        		}).addListener(function(unit, amount, total){
					if(total == 0) 
					{
						clear_score();
						stop_asteroids = true;
					}
				});
        	}
        };
        var clear_score = function () {
        	players = [];
        	for(var i = 0; i < 100; i++)
        	{
        		$("#"+i).addClass('hide_player');
        	}
        	$.ajax({
				type:"POST",
				data: {
					email:readCookie("email").replace("%40","@"),
					score: score
				},
				url: "http://"+domain+"/clear",
				success: function (response)
				{
					console.log(response);
					if(response == "top")
					{
						$('#modal-body').text("Great game! Your score for this round was " + score*10 + ". That is your new top score!");
					}
					else if(response == "clear")
					{
						$('#modal-body').text("Great game! Your score for this round was " + score*10 + ".");
					}
					else
					{
						$('#modal-body').text("Great game! Your score for this round was " + score*10 + ". Sorry but we could not save your score, please re-login");
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
        		decrease_score_color();
        	}
        };
        var increase_score_color = function()
        {
        	$("#score").stop().css({"color":"#71F522"},function(){
	        	setTimeout(function () {
	        		$("#score").css({"color":"rgb(245,245,245)"});
	    		}, 250);
        	});
        	score++;
        	$("#score").text(score * 10);
        };
        var decrease_score_color = function()
        {
        	$("#score").css({"color":"rgb(249,47,8)"});
        	setTimeout(function () {
        		$("#score").css({"color":"rgb(245,245,245)"});
    		}, 250);
        	score--;
        	$("#score").text(score * 10);
        };
        var updateScore = function(player_id) {
			increase_score_color();
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
        	var index = $.inArray( coordinates.email, players);
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
        var high_scores = function() {
        	$("#highscore_table").modal("show");
        	$.ajax({
				type:"POST",
				url: "http://"+domain+"/highscore",
				success: function (users)
				{
					try
					{
						users[0].email;
					}
					catch(e)
					{
						return;
					}
					for(var i = 0; i < users.length; i++)
					{
						$("#high_score_list").children('tr').eq(i).children('td').eq(1).text(users[i].email);
						$("#high_score_list").children('tr').eq(i).children('td').eq(2).text(users[i].top_score);
					}
				},
				error: function (response)
				{
					console.log(response);
				}
			});
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
        	$('#credentials').modal("show");
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
				url: "http://"+domain+"/register",
				success: function (response)
				{
					if(response == "success")
					{
						$("#register").children("label").addClass("has-success");
						$("#email").addClass("has-success");
						$("#password").addClass("has-success");
						setTimeout(function() {
							window.location.href = "http://"+domain+"/walkthrough";
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
				url: "http://"+domain+"/login",
				success: function (response)
				{
					if(response == "valid")
					{
						$("#login").children("label").addClass("has-success");
						$("#email_login").addClass("has-success");
						$("#password_login").addClass("has-success");
						setTimeout(function() {
							window.location.href = "http://"+domain+"/cursor_game";
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