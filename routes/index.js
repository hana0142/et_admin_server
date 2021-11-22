const express = require('express')
const router = express.Router()
const passport = require('passport')
const {spawn} = require('child_process');
const pyshell = require('python-shell');
//const { User } = require('../database/models/index');
const pool = require('../config/database.js');

router.get('/index', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('./index.ejs', {
            title: 'Home',
            user: req.user,
            message: res.locals.message
        })
    } else {
        res.render('./index', {
            title: 'Home',
            user: req.user,
            message: res.locals.message
        })
    }
})

router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('./index.ejs', {
            title: 'Home',
            user: req.user,
            message: res.locals.message
        })
    } else {
        res.render('./index', {
            title: 'Home',
            user: req.user,
            message: res.locals.message
        })
    }
})


router.get('/user_home',(req,res) => {
	if(req.isAuthenticated()) {
		res.render('./indexPrompt.ejs',{
			title : user_home,
			user:req.user,
			message:res.locals.message
		})
	} else {
		res.render('./user_home.ejs',{
		})
	}
})

router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        req.flash('message', 'Your are already logged in.')
        res.redirect('/profile')
    } else {
        res.render('login', {
            title: 'Login',
            user: req.user,
            message: res.locals.message
        })
    }
})
router.post('/login', (req, res, next) => {
    if (req.isAuthenticated()) {
        req.flash('message', 'You are already logged in.')
        res.redirect('/profile')
    } else {
        let user = (req.body.username).toLowerCase()
        let pass = req.body.password
        if (user.length === 0 || pass.length === 0) {
            req.flash('message', 'You must provide a username and password.')
            res.redirect('/login')
        } else {
            next()
        }
    }
}, passport.authenticate('login', {
    successRedirect : '/profile',
    failureRedirect : '/login',
    failureFlash : true
}))

router.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/profile')
    } else {
        res.render('register', {
            title: 'Register',
            user: req.user,
            message: res.locals.message
        })
    }
})


router.post('/register', (req, res, next) => {
    if (req.isAuthenticated()) {
        req.flash('message', 'You are already logged in.')
        res.redirect('/profile')
    } else {
        let user = (req.body.userid).toLowerCase()
        let pass = req.body.password
        let passConf = req.body.passConf
	let useremail = req.body.email
	let username = req.body.username
	let gender = req.body.gender
	let birthdate = req.body.birthdate
	let age = req.body.age

        if (user.length === 0 || pass.length === 0 || passConf.length === 0) {
            req.flash('message', 'You must provide a username, password, and password confirmation.')
            res.redirect('/login')
        } else if (pass != passConf) {
            req.flash('message', 'Your password and password confirmation must match.')
            res.redirect('/login')
        } else {
            next()
        }
    }
}, passport.authenticate('register', {
    successRedirect : '/profile',
    failureRedirect : '/register',
    failureFlash : true
}))

router.get('/logout', (req, res) => {
    if (req.isAuthenticated()) {
        console.log('User [' + req.user.username + '] has logged out.')
        req.logout()
        res.redirect('/');
    } else {
        res.redirect('/')
    }
})

router.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('profile', {
            title: 'Profile',
            user: req.user,
            message: res.locals.message
        })
    } else {
        res.redirect('/login')
    }
})

router.get('/contact', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/contact')
    } else {
        res.render('contact', {
            title: 'contact',
            user: req.user,
            message: res.locals.message
        })
    }
})

router.get('/eyetracking', (req,res) => {
	res.render('eyetracking', {
            title: 'tracking',
            user: req.user,
            message: res.locals.message
        })
});

router.get('/profile_login2', (req,res) => {
        res.render('profile_login', {
            title: 'profile',
            user: req.user,
            message: res.locals.message
        })
});


router.get('/eyetracking/start', (req, res) => {
	if (req.isAuthenticated()){
		const userid = req.user.userid
		var options = {
			mode : 'text',
			//pythonPath : '/usr/bin/python3',
			//scriptPath:'',
			pythonOptions : ['-u'],
			args:[userid]
		};
		pyshell.PythonShell.run('main.py',options, function(err, results){
			if(err) console.log(err);
			else console.log(results);
		});
	}
	else {
		res.redirect('/login');
	}
                                 
});
router.get('/profile_login',async (req,res,next) =>
	{
		const client = await pool.connect();
		if(req.isAuthenticated()){
			 var userid = req.user.userid;

                        //var sql = ('SELECT * FROM tb_data WHERE userid=$1', [userid]);
                        try {
                                await client.query('select * from tb_users where userid=$1',[userid],(err,result) =>{

                                        if (err) {
                                                return next(err)
                                        }
                                        else{
                                         res.render('profile_login', {
                                                rows:result.rows,
                                                user:req.user
                                         });
                                                console.log(result.rows)
                                        }
                                });
			}
			catch(err){
                                console.log(err)
                        }
                }
                else {
                        res.redirect('/login');}
});

router.get('/result', async (req,res,next)=> 
	{
		const client = await pool.connect();
		if(req.isAuthenticated())
		{
			var userid = req.user.userid;
			var sql1 = "select * from tb_oper where userid=$1";
			var sql2 = "select * from tb_user_oper where userid=$1";
			//var sql = ('SELECT * FROM tb_data WHERE userid=$1', [userid]);
			try {
				//await client.query('with tb_result as (select o.index,o.userid, o.operno, o,operdate, uo.left_eye, uo.right_eye, uo.dep_time, uo.arr_time from tb_oper as o join tb_user_oper as uo on o.operno = uo.operno and o.userid = uo.userid) select * from tb_result where userid=$1;',[userid],(err,result) =>{
				await client.query(sql1,[userid],function(err,rows,fields)
					{
					if (err) throw err;
					client.query(sql2,[userid], function (err, rows1, fields)
						{
						if (err) throw err;
						res.render('result', {rows:rows.rows, rows1:rows1.rows, user:req.user});
						res.end;
						client.end();
							//console.log(rows);
				});
			});
			}
			catch(err){
				console.log(err)
			}
		}
				else{
					res.redirect('/login');
				}});




					/**
						return next(err)
					}
					else{
						var sql1_result = results[0];
						//var sql2_result = results[1];
					 res.render('board', {
						data:sql1_results.rows,
						//data2:sql2_results.rows, 
                                                user:req.user
					 });
						console.log(result)
					}
                		});**/

				//result = result.rows
				//result = JSON.stringify(result);
				//res.render('board',{result:result.rows,
				//			user:req.user});
				//console.log(userid,results.rows)
				//}
			
				//const userdata = await client.query('select * from tb_data where username=$1',[username]);
				//const userdata = await client.query('select "username","left_eye","right_eye","dep_time","arr_time" from "tb_data" where "username"=$1',[username]);
				//const test = await client.query('select * from tb_data');
				//const result = JSON.stringify(userdata);
				
				//where "username"=$1', [username]));
				//obj = {data:result};
				//res.render('board.ejs',{data:result});
				//console.log(result);
				//console.log(userdata);
				//console.log(userid);
			//catch(err){
			//	console.log(err)
			//}
		//}
		//else {
		//	res.redirect('/login');}
//});
	
router.post('/updpass', (req, res, next) => {
    if (req.isAuthenticated()) {
        let password = req.body.password
        let newpass = req.body.newpass
        let newpassconf = req.body.newpassconf
        if (password.length === 0 || newpass.length === 0 || newpassconf.length === 0) {
            req.flash('message', 'You must provide your current password, new password, and new password confirmation.')
            res.redirect('/profile')
        } else if (newpass != newpassconf) { 
            req.flash('message', 'Your password and password confirmation must match.')
            res.redirect('/profile')
        } else {
            next()
        }
    } else {
        res.redirect('/')
    }
}, passport.authenticate('updatePassword', {
    successRedirect : '/profile',
    failureRedirect : '/profile',
    failureFlash : true
}))

module.exports = router; 
