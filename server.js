const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const MongoClient = require('mongodb').MongoClient

var db

MongoClient.connect('mongodb://doctor:doctor3467@ds131687.mlab.com:31687/medication-reminder', (err, database) => {
    if (err) return console.log(err)
    db = database
    app.listen(3000, () => {
        console.log('listening on 3000')
    })
})

app.use(bodyParser.urlencoded({ extended: true }))

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(bodyParser.json())

app.get('/', (req, res) => {
    db.db('medication-reminder').collection('medications').find().toArray((err, result) => {
        if (err) return console.log(err)
        // renders index.ejs
        res.render('index.ejs', { medications: result })
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
    db.db('medication-reminder').collection('medications').findOneAndDelete({ medication: req.body.del_medication},
    (err, result) => {
      if (err) {return res.status(500).send(err)}
      res.send({message: 'A medication was deleted'})
    })
  })