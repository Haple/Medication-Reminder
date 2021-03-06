const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const MongoClient = require('mongodb').MongoClient
const session = require('express-session')
const bcrypt = require('bcrypt')
var ObjectId = require('mongodb').ObjectID
var MongoDBStore = require('connect-mongodb-session')(session)

var db

app.set('port', (process.env.PORT || 3000))

MongoClient.connect('mongodb://doctor:doctor3467@ds131687.mlab.com:31687/medication-reminder', (err, database) => {
    if (err) return console.log(err)
    db = database
    app.listen(app.get('port'), () => {
        console.log('listening on ' + app.get('port'))
    })
})

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
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week in miliseconds
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

    if (req.session.userId == null) {
        return res.render('login.ejs')
    } else {
        return res.redirect('/profile')
    }
    /*
        db.db('medication-reminder').collection('users').findOne({ "_id": req.session.userId },
            (err, result) => {
    
                if (err) { return res.status(500).send(err) }
                else {
                    if (result === null) {
                        return res.render('login.ejs')
                    } else {
                        return res.redirect('/profile')  
                    }
                }
    
            })
            */
})

app.post('/medications', (req, res) => {

    var medication = req.body

    console.log("Medication created! User: " + req.session.userId)
    medication["userId"] = req.session.userId

    db.db('medication-reminder').collection('medications').save(medication, (err, result) => {
        if (err) return console.log(err)

        console.log('saved to database')
        res.redirect('/profile')
    })

})
//  
app.delete('/medications', (req, res) => {
    //console.log("pls, delete this medication: "+req.body.del_medication)
    db.db('medication-reminder').collection('medications').deleteOne({ _id: new ObjectId(req.body.del_medication) },
        (err, result) => {
            if (err) { return res.status(500).send(err) }
            return res.redirect('/profile')
        })
})

app.delete('/users', (req, res) => {
    // console.log("pls, delete this user: "+req.body.del_user)
    db.db('medication-reminder').collection('users').deleteOne({ _id: new ObjectId(req.body.del_user) },
        (err, result) => {
            if (err) { return res.status(500).send(err) }
            return res.redirect('/profile')
        })
})

//End of routes for medication
app.post('/register', (req, res) => {
    if (req.body.password !== req.body.passwordConf) {
        return res.status(400).send('Passwords do not match.')
    }
    var userData = {
        email: req.body.email,
        username: req.body.username,
        cpf: req.body.cpf,
        rg: req.body.rg,
        password: bcrypt.hashSync(req.body.password, 10),
        perfil: req.body.perfil ? req.body.perfil : "1", //trocar para 2(user default)
        medications: []
    }
    db.db('medication-reminder').collection('users').save(userData, (err, result) => {
        if (err) {
            return res.status(500).send(err)
        } else {
            req.session.userId = result.id
            res.redirect('/')
        }
    })
})

//Routes for user authentication
app.post('/', (req, res) => {
    // confirm that user typed same password twice
    if (req.body.password !== req.body.passwordConf) {
        return res.status(400).send('Passwords do not match.')
    }
    if (req.body.logemail && req.body.logpassword) {
        db.db('medication-reminder').collection('users').findOne({ email: req.body.logemail }, (err, result) => {

            if (err) { return res.status(500).send(err) }
            else if (!result) {
                return res.status(401).send(err)
            }

            if (bcrypt.compareSync(req.body.logpassword, result.password)) {
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

    var userData = {}
    var medications = {}
    var usersList = {}

    db.db('medication-reminder').collection('users').findOne({ "_id": req.session.userId },
        (err, result) => {

            if (err) { return res.status(500).send(err) }
            else {
                if (result === null) {
                    return res.status(400).send('Not authorized! Go back!')
                } else {
                    var userDocument = result
                    userData = {
                        username: userDocument.username,
                        email: userDocument.email,
                        perfil: userDocument.perfil
                    }
                }
            }

        })

    db.db('medication-reminder').collection('users').find().toArray((err, result) => {

        if (err) { return res.status(500).send(err) }
        usersList = result
    })

    db.db('medication-reminder').collection('medications').find({ "userId": req.session.userId }).toArray((err, result) => {

        if (err) { return res.status(500).send(err) }
        else {
            if (result === null) {
                return res.status(400).send('Not authorized! Go back!')
            } else {
                var medications = result

                return res.render('index.ejs', { user: userData, medications: medications, users: usersList })
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