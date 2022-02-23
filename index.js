const express = require('express')
const app = express()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const fileUpload = require('express-fileupload')
const bodyParser = require('body-parser')
require('dotenv').config();

app.use(cors())
app.use(bodyParser.json())
app.use(express.static('doctors'));
app.use(fileUpload())

app.get('/', function (req, res) {
  res.send('Hello, Server is Online')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhxyp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentCollection = client.db("doctorsPortal").collection("appointmens");
  const doctorsCollection = client.db("doctorsPortal").collection("doctors");
  const usersCollection = client.db("doctorsPortal").collection("users");

  app.get('/allPatients', (req, res) => {
    appointmentCollection.find()
      .toArray((err, patient) => {
        res.send(patient)
      })
  })

  app.get('/addADoctor', (req, res) => {
    doctorsCollection.find()
      .toArray((err, patient) => {
        res.send(patient)
      })
  })

  app.post('/addAppointment', (req, res) => {
    const date = req.body;
    // console.log(date)
    appointmentCollection.insertOne(date)
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  })

  app.post('/appointmentsByDate', (req, res) => {
    const date = req.body;
    const email = req.body.email;
    // console.log(req.body.email)

    doctorsCollection.find({ email: email })
      .toArray((err, doctors) => {
        const filter = { date: date.date }
        // console.log(filter)
        if (doctors.length === 0) {
          filter.email = email;
        }

        appointmentCollection.find(filter)
          .toArray((err, documents) => {
            res.send(documents)
          })
      })

  })

  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;
    doctorsCollection.find({ email: email })
      .toArray((err, doctors) => {
        res.send(doctors.length > 0)
      })

  })


  app.post('/users', async (req, res) => {
    const user = req.body;
    // console.log(user)
    const result = await usersCollection.insertOne(user);
    // console.log(result);
    res.json(result);
  });

  app.get('/users/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    let isAdmin = false;
    if (user?.role === 'admin') {
        isAdmin = true;
    }
    res.json({ admin: isAdmin });
})



  // app.post('/addADoctor', (req, res) => {
  //   const file = req.files.file;
  //   const name = req.body.name;
  //   const email = req.body.email;
  //   console.log(file, name, email)
  //   file.mv(`${__dirname}/doctors/${file.name}`, err => {
  //     if(err){
  //       console.log(err)
  //       return res.status(500).send({msg: "Failed to upload image"})
  //     }
  //     return res.send({name: file.name, path: `/${file.name}`})
  //   })
  // })

  app.post('/addADoctor', async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const pic = req.files.file;
    // console.log(pic)
    const picData = pic.data;
    const encodedPic = picData.toString('base64');
    const imageBuffer = Buffer.from(encodedPic, 'base64');
    const doctor = {
      name,
      email,
      image: imageBuffer
    }
    const result = await doctorsCollection.insertOne(doctor);
    res.json(result);
  })

});

app.listen(4400)