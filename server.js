const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const MongoClient = require('mongodb').MongoClient
const session = require('express-session')
var MongoDBStore = require('connect-mongodb-session')(session)
var bcrypt = require('bcrypt')


var db

app.set('port', (process.env.PORT || 3000))

MongoClient.connect('mongodb://doctor:doctor3467@ds131687.mlab.com:31687/medication-reminder', (err, database) => {
    if (err) return console.log(err)
    db = database
    app.listen(app.get('port'), () => {
        console.log('listening on ' + app.get('port'))
    })
})

/*/use sessions for tracking logins
app.use(session({
    secret: 'work hard',
    resave: true,
    saveUninitialized: false,
    store: new MongoDBStore({
        url: 'mongodb://doctor:doctor3467@ds131687.mlab.com:31687/medication-reminder'
    })
}))
*/
var store = new MongoDBStore(
    {
        uri: 'mongodb://doctor:doctor3467@ds131687.mlab.com:31687/medication-reminder',
        collection: 'mySessions'
    });

// Catch errors
store.on('error', function (error) {
    assert.ifError(error);
    assert.ok(false);
});

app.use(require('express-session')({
    secret: 'This is a secret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store,
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }))

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(bodyParser.json())


//Routes for Medications
app.get('/', (req, res) => {
    db.db('medication-reminder').collection('medications').find().toArray((err, result) => {
        if (err) return console.log(err)
        // renders index.ejs
        res.render('index.ejs', { medications: result, user: null })
    })
})

app.post('/medications', (req, res) => {
    db.db('medication-reminder').collection('medications').save(req.body, (err, result) => {
        if (err) return console.log(err)

        console.log('saved to database')
        res.redirect('/')
    })
})

app.delete('/medications', (req, res) => {
    db.db('medication-reminder').collection('medications').findOneAndDelete({ medication: req.body.del_medication },
        (err, result) => {
            if (err) { return res.status(500).send(err) }
            res.send({ message: 'A medication was deleted' })
        })
})
//End of routes for medication

//Routes for user authentication
app.post('/', (req, res) => {
    // confirm that user typed same password twice
    if (req.body.password !== req.body.passwordConf) {
        return res.status(400).send('Passwords do not match.')
    }

    if (req.body.email &&
        req.body.username &&
        req.body.password &&
        req.body.passwordConf) {

        var userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password
        }

        db.db('medication-reminder').collection('users').save(userData, (err, result) => {
            if (err) {
                return res.status(500).send(err)
            } else {
                req.session.userId = result.id
                res.redirect('/')
            }
        })

    } else if (req.body.logemail && req.body.logpassword) {
        db.db('medication-reminder').collection('users').findOne({ email: req.body.logemail }, (err, result) => {

            if (err) { return res.status(500).send(err) }
            else if (!result) { return res.status(401).send(err) }

            if (req.body.logpassword == result.password) {
                var userId = result._id
                console.log(userId)
                req.session.userId = userId
                res.redirect('/profile')
            } else {
                return res.status(500).send(err)
            }

        })

    } else {
        return res.status(500).send('All fields required.')
    }
})

app.get('/profile', (req, res) => {

    db.db('medication-reminder').collection('users').findOne({"_id": req.session.userId },
        (err, result) => {
            
            if (err) { return res.status(500).send(err) }
            else {
                if (result === null) {
                    return res.status(400).send('Not authorized! Go back!')
                } else {
                    var userDocument = result
                    console.log(userDocument)
                    var userData = {
                        username: userDocument.username,
                        email: userDocument.email
                    }
                    return res.render('index.ejs', { user: userData, medications: {medication:"", time:""}})
                }
            }
        })
})

app.get('/logout', (req, res) => {
    if (req.session) {
        // delete session object
        req.session.destroy(function (err) {
            if (err) {
                return res.send(err)
            } else {
                return res.redirect('/')
            }
        });
    }
})
//End of the routes for authentication