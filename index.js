const express = require('express')
const mysql = require('mysql')
const app = express()
const multer = require("multer");
const upload = multer({ dest: "./public/img" });
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
dotenv.config({ path: './.env'});
const port = 80

var connection = mysql.createConnection({
    host     : process.env.db_host,
    user     : process.env.db_user,
    password : process.env.db_password,
    database : process.env.db_database
  });
connection.connect();

app.set('view engine', 'handlebars')
app.set('view engine', 'hbs');
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

function authenticateTocken(req, res, nex) {
  const authHeader = req.headers['authorization']
  const token = authHeader &&  authHeader.split(' ')[1]
  if(token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.jwt_secret, (err, user) => {
    if(err) return res.sendStatus(403)
    req.user = user
    nex()
  })
}

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/info', authenticateTocken, (req, res) => {
  try {
    connection.query(`SELECT * FROM photos WHERE id=${req.query.id}`, function (error, results, fields) {
      if (error) throw error;
      //console.log(req.query.id);
      connection.query(`UPDATE photos SET views=views+1 WHERE id=${req.query.id}`, function (error, viewresults, fields) {
        if (error) throw error;
      });
      res.send(results);
    });
  }
  catch (exception_var) {
  }
})

app.get('/cat', authenticateTocken, (req, res) => {
  try {
    connection.query(`SELECT * FROM category WHERE status= '1' ORDER BY id asc`, function (error, results, fields) {
      if (error) throw error;
      //console.log(req.query.id);
      res.send(results);
    });
  }
  catch (exception_var) {
  }
})

app.post('/register', async (req, res) => {
    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(req.body.newpassword, salt)
      let userdata = {email: req.body.email, username: req.body.newusername, password: hashedPassword, fname: req.body.fname, lname: req.body.lname, token: ' '}
        connection.query(`SELECT username FROM users WHERE username=${connection.escape(req.body.newusername)}`, function (error, results, fields) {
          if (error) throw error;
            if(results == "") {
              connection.query('INSERT INTO users SET ?', userdata, function (error, results, fields) {
                if (error) throw error;
                res.send(results);
              });
            }else {
              console.log("Not found")
              res.send(`Username "${req.body.newusername}" is already in use!`);
            }
        });
      }
      catch (exception_var) {
        console.log(exception_var)
      }
  
})

app.post('/login', async (req, res) => {
  const user = {user: req.body.username}
  //console.log(user)
  const accesstoken = jwt.sign(user, process.env.jwt_secret)
  try {
    connection.query(`SELECT * FROM users WHERE username='${req.body.username}'`, function (error, results, fields) {
      //if (error) throw error;
      if(results == "") {
        res.send({status: "fail"})
      } else {

        bcrypt.compare(req.body.password, results[0].password, function(err, isMatch) {
          if (err) {
            throw err
          } else if (!isMatch) {
            res.send({status: "fail"})
            // console.log("fail")
          } else {
            res.send({status: "pass", username: req.body.username, token: accesstoken})
            // console.log("pass")
          }
        })
      }
    });
  }
  catch (exception_var) {
    //console.log("error")
  }
  
})

app.get('/radius', authenticateTocken, (req, res) => {
  try {
    let lat = req.query.lat;
    let lng = req.query.lng;
    let radius = req.query.radius;

    connection.query(`SELECT id,lat,lng, ( 6371 * ACOS( COS( RADIANS( lat ) ) * COS( RADIANS( ${lat} ) ) * COS( RADIANS( ${lng} ) - RADIANS( lng ) ) + SIN( RADIANS( lat ) ) * SIN( RADIANS( ${lat}) ) ) ) AS distance FROM photos WHERE status=1 HAVING distance <= ${radius} ORDER BY distance ASC;`, function (error, results, fields) {
      if (error) throw error;
      console.log(results)
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }
})

app.post("/upload", upload.single("photo"), uploadFiles);
  function uploadFiles(req, res) {
    fs.rename(`./public/img/${req.file.filename}`, `./public/img/${req.file.filename}.jpg`, function(err) {
      if (err) {
          console.log('ERROR: ' + err);
      }
      console.log('File renamed!!');
      res.json({ message: "Successfully uploaded files", image: `${req.file.filename}.jpg` });
  });
}

app.post('/picsave', authenticateTocken, (req, res) => {
  try {
    let userdata = {
      user: req.body.username,
      title: req.body.title,
      info: req.body.info,
      camera: req.body.camera,
      lens: req.body.lens,
      iso: req.body.iso,
      shutter: req.body.shutter,
      aperture: req.body.fstop,
      likes: 0,
      views: 0,
      status: 1,
      lat: req.body.lat,
      lng: req.body.lng,
      filename: req.body.filename
    }
      connection.query('INSERT INTO photos SET ?', userdata, function (error, results, fields) {
        if (error) throw error;
        res.json({ message: "Saved"});
      });
    }
    catch (exception_var) {
      console.log(exception_var)
    }
  console.log(req.body)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})