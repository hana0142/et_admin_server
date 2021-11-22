const bcrypt= require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
//const uuid = require('uuid').v1;
const pool = require('./database.js')

var LocalStrategy = require('passport-local').Strategy

let accData = []

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

passport.use('login', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, userid, password, done) {
        loginUser()
        async function loginUser() {
            const client = await pool.connect()
            try {
                await client.query('BEGIN')
                var accData = await JSON.stringify(client.query('SELECT "userid", "password" FROM "tb_users" WHERE "userid"=$1', [userid], (err, result) => {
                    if (err) {
                        return done(err)
                    }

                    if (result.rows[0] == null) {
					    return done(null, false, req.flash('message', "Incorrect username or password"))
                    } else {
                        bcrypt.compare(password, result.rows[0].password, (err, valid) => {
                            if (err) {
                                console.log("Error on password validation")
                                return done(err)
                            }
                            if (valid) {
                                console.log('User [' + req.body.username + '] has logged in.')
                                return done(null, {userid: result.rows[0].userid})
                            } else {
                                return done(null, false, req.flash('message', "Incorrect username or password"))
                            }
                        })
                    }
                }))
            }
            catch(e) {
                throw (e)
            }
        }
    }))


    passport.use('register', new LocalStrategy({
        useridField : 'userid',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, userid, password, done) {
        registerUser()
        async function registerUser() {
            const client = await pool.connect()
            try {
                await client.query('BEGIN')
                let passHash = await bcrypt.hash(req.body.password, 8)
                await JSON.stringify(client.query('SELECT userid FROM tb_users WHERE userid=($1)', [req.body.userid], (err, result) => {
                    if (err) {
                        return done(err)
                    }

                    if (!testUser(req.body.userid)) {
                        return done(null, false, req.flash('message', 'Please provide a valid username'))
                    }
                    else if (!testPass(req.body.password)) {
                        return done(null, false, req.flash('message', 'Please provide a valid password'))
                    } else {
                        if (result.rows[0]) {
                            return done(null, false, req.flash('message', 'Sorry, this username is already taken.'))
                        } else {
                            client.query('INSERT INTO tb_users (userid, password, email, username,gender,birthdate,age) VALUES ($1, $2, $3, $4, $5, $6,$7)', [req.body.userid,passHash,req.body.email, req.body.username, req.body.gender, req.body.birthdate, req.body.age], (err, result) => {
                                if (err) {
                                    console.log(err)
                                }
                                else {
                                    client.query('COMMIT')
                                    console.log('User [' + req.body.userid + '] has registered.')
                                    //console.log(result)
                                    return done(null, {userid: req.body.userid})
                                }
                            });
                        }
                    }
                }))
            }
            catch(e) {
                throw (e)
            }
        }
    }))

    passport.use('updatePassword', new LocalStrategy({
        usernameField : 'password',
        passwordField : 'newpass',
        passReqToCallback : true
    },
    function(req, password, newpass, done) {
        let username = (req.user.username).toLowerCase()
        updatePassword()
        async function updatePassword() {
            const client = await pool.connect()
            try {
                await client.query('BEGIN')
                let newPassHash = await bcrypt.hash(req.body.newpass, 8)
                var accData = await JSON.stringify(client.query('SELECT id, "username", "password" FROM "users" WHERE "username"=$1', [req.user.username.toLowerCase()], (err, result) => {
                    if (err) {
                        return done(err)
                    }

                    if (!testPass(req.body.password) ) {
                        return done(null, false, req.flash('message', 'Please provide a valid password'))
                    } else if (!testPass(req.body.newpass)) {
                        return done(null, false, req.flash('message', 'Please provide a valid password'))
                    } else {
                        if(result.rows[0] == null) {
                            return done(null, false, req.flash('message', 'Error on changing password. Please try again'))
                        } else {
                            bcrypt.compare(req.body.password, result.rows[0].password, (err, valid) => {
                                if (err) {
                                    console.log("Error on current password validation")
                                    return done(err)
                                }
                                if (valid) {
                                    client.query('UPDATE users SET password=($1) WHERE username=($2)', [newPassHash, req.user.username], (err, result) => {
                                        if (err) {
                                            console.log(err)
                                        }
                                        else {
                                            client.query('COMMIT')
                                            console.log('User [' + req.user.username + '] has updated their password.')
                                            //console.log(result)
                                            return done(null, {username: req.user.username}, req.flash('message', 'Your password has been updated.'))
                                        }
                                    });
                                } else {
                                    req.flash('message', "Incorrect current password entered")
                                    return done(null, false)
                                }
                            })
                        }
                    }
                }))
            }
            catch(e) {
                throw (e)
            }
        }
    }))
}

function testUser(input) {
    let format = /^[a-zA-Z0-9_-]{4,16}$/
    return format.test(input)
}
function testPass(input) {
    let format = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,128}$/
    return format.test(input)
}
