const express = require('express')
const mysql = require('mysql')
const app = express()
const multer = require("multer");
const upload = multer({ dest: "./public/img" });
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
var bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var Fraction = require('fractional').Fraction
dotenv.config({ path: './.env'});
var ExifImage = require('exif').ExifImage;
const { Console } = require('console');
const port = 80;

const math = require('mathjs')

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

function dms2deg(s) {

  // Determine if south latitude or west longitude
  var sw = /[sw]/i.test(s);

  // Determine sign based on sw (south or west is -ve) 
  var f = sw? -1 : 1;

  // Get into numeric parts
  var bits = s.match(/[\d.]+/g);

  var result = 0;

  // Convert to decimal degrees
  for (var i=0, iLen=bits.length; i<iLen; i++) {

    // String conversion to number is done by division
    // To be explicit (not necessary), use 
    //   result += Number(bits[i])/f
    result += bits[i]/f;

    // Divide degrees by +/- 1, min by +/- 60, sec by +/-3600
    f *= 60;
  }

  return result;
}

// ****************************************
// ****************************************
// ****       Rendering Pages          ****
// ****************************************
// ****************************************

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/search', (req, res) => {
  res.render('search')
})











// ****************************************
// ****************************************
// ****       Marker Functions         ****
// ****************************************
// ****************************************

app.get('/info', (req, res) => {
  try {
    connection.query(`SELECT * FROM photos WHERE id=${req.query.id}`, function (error, results, fields) {
      if (error) throw error;
     
      connection.query(`UPDATE photos SET views=views+1 WHERE id=${req.query.id}`, function (error, viewresults, fields) {
        if (error) throw error;
      });
      res.send(results);
    });
  }
  catch (exception_var) {
  }
})

app.get('/markers', (req, res) => {
  try {
    let lat = req.query.lat;
    let lng = req.query.lng;
    let radius = req.query.radius;
    
    //6371

    connection.query(`SELECT id,lat,lng, ( 5571 * ACOS( COS( RADIANS( lat ) ) * COS( RADIANS( ${lat} ) ) * COS( RADIANS( ${lng} ) - RADIANS( lng ) ) + SIN( RADIANS( lat ) ) * SIN( RADIANS( ${lat}) ) ) ) AS distance FROM photos WHERE status=1 HAVING distance <= ${radius} ORDER BY distance ASC;`, function (error, results, fields) {
      if (error) throw error;
      //console.log(results)
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }
})






//  ****************************************
// ****************************************
// ****        User Functions          ****
// ****************************************
// ****************************************
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
                res.send("Your account is now setup!");
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

app.post('/guest', async (req, res) => {
  try {
    connection.query(`Update visitor SET login = login + 1 WHERE id= 1`, function (error, results, fields) {
      //if (error) throw error;
      if(results == "") {
        res.send({status: "fail"})
      } 
    });
  }
  catch (exception_var) {
    //console.log("error")
  }
  
})


app.get('/myview', (req, res) => {
  let user = req.query.user
  console.log(user)
  try {
    connection.query(`SELECT lat,lng,zoom FROM users WHERE username= '${user}'`, function (error, results, fields) {
      if (error) throw error;
      //console.log(req.query.id);
      res.send(results);
    });
  }
  catch (exception_var) {
  }
})












// ****************************************
// ****************************************
// ****       Marker Functions         ****
// ****************************************
// ****************************************
app.get('/cat', authenticateTocken, (req, res) => {
  try {
    connection.query(`SELECT * FROM category WHERE status= '1' ORDER BY category asc`, function (error, results, fields) {
      if (error) throw error;
      //console.log(req.query.id);
      res.send(results);
    });
  }
  catch (exception_var) {
  }
})

// app.post("/upload", upload.single("photo"), uploadFiles);
//   function uploadFiles(req, res) {
//     fs.rename(`./public/img/${req.file.filename}`, `./public/img/${req.file.filename}.jpg`, function(err) {
//       if (err) {
//           console.log('ERROR: ' + err);
//       }
//       console.log('File renamed!!');
//       res.json({ message: "Successfully uploaded files", image: `${req.file.filename}.jpg` });
//   });
// }


app.post("/upload", upload.single("photo"), uploadFiles);
  function uploadFiles(req, res) {
    
    fs.rename(`./public/img/${req.file.filename}`, `./public/img/${req.file.filename}.jpg`, function(err) {
      if (err) {
          console.log('ERROR: ' + err);
      }
      

      try {
        new ExifImage({ image : `./public/img/${req.file.filename}.jpg` }, function (error, exifData) {
            if (error)
                console.log('Error: '+error.message);
            else
                //console.log(exifData); // Do something with your data!
                var f = math.fraction(exifData.exif.ExposureTime);
                let gpsLat = dms2deg(`${exifData.gps.GPSLatitudeRef} ${exifData.gps.GPSLatitude[0]} ${exifData.gps.GPSLatitude[1]}\' ${exifData.gps.GPSLatitude[2]}\"`)
                let gpsLNG = dms2deg(`${exifData.gps.GPSLongitudeRef} ${exifData.gps.GPSLongitude[0]} ${exifData.gps.GPSLongitude[1]}\' ${exifData.gps.GPSLongitude[2]}\"`)


                // console.log(exifData.gps)
            

                let img_data = {
                  message: "Successfully uploaded files", 
                  image: `${req.file.filename}.jpg`,
                  camera: `${exifData.image.Make} ${exifData.image.Model}`,
                  lens: exifData.exif.LensModel,
                  iso: exifData.exif.ISO,
                  shutter: `${f.n}/${f.d} sec`,
                  aperture: `f/${exifData.exif.ApertureValue}`,
                  gps: {
                    lat: gpsLat,
                    lng: gpsLNG
                  }
                }
                console.log(img_data)
                res.send(JSON.stringify(img_data))



        });
    } catch (error) {
      res.json({ message: "Successfully uploaded files", image: `${req.file.filename}.jpg` });
    }




      

     
  });
}

app.post('/picsave', authenticateTocken, (req, res) => {
  try {
    let userdata = {
      user: req.body.username,
      title: req.body.title,
      info: req.body.info,
      category: req.body.category,
      camera: req.body.camera,
      lens: req.body.lens,
      iso: req.body.iso,
      shutter: req.body.shutter,
      aperture: req.body.fstop,
      likes: 0,
      views: 0,
      status: 1,
      tags: req.body.tags,
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










// ******************************************************************************************************************************************************************************
// ******************************************************************************************************************************************************************************
// ******************************************************************************************************************************************************************************
// ************************************************-------------------------------------------------------------------------------------*****************************************
// ***********************************************|                                Search Functions                                     |****************************************
// ************************************************--------------------------------------------------------------------------------------****************************************
// ******************************************************************************************************************************************************************************
// ******************************************************************************************************************************************************************************
// ******************************************************************************************************************************************************************************
app.get('/toplist', (req, res) => {
  try {
    let cat = req.body.cat;
    connection.query(`SELECT id from photos WHERE category ='${cat}' AND status = 1 ORDER BY Views DESC LIMIT 50;`, function (error, results, fields) {
      if (error) throw error;
      //console.log(results)
      res.send(results);
    });

  }
  catch (exception_var) {
    console.log("Error");
  }
})

app.get('/find', (req, res) => {
    let type = req.query.type
    let search = req.query.search
  if(type == 'username') {
    try {
    
      connection.query(`SELECT user, count(*) as occurrences FROM photos WHERE user LIKE'%${search}%' GROUP BY user ORDER BY occurrences`, function (error, results, fields) {
        if (error) throw error;
        res.send(results);
      });
  
    }
    catch (exception_var) {
      console.log("Error");
    }
  } else {
    res.send(type)
  }
})

app.get('/myphotos', (req, res) => {
  let user = req.query.user

  try {
  
    connection.query(`SELECT id,lat,lng FROM photos WHERE user='${user}'`, function (error, results, fields) {
      if (error) throw error;
      //console.log(results)
      res.send(results);
    });

  }
  catch (exception_var) {
    console.log("Error");
  }

})


// ****************************************
// ****************************************
// ****          Like API's            ****
// ****************************************
// ****************************************

app.get('/likecheck', (req, res) => {
  let picid = req.query.picid;
  let userid = req.query.userid;

  try {
    connection.query(`SELECT count(*) as occurrences FROM likes WHERE photo_id ='${picid}' AND username='${userid}';`, function (error, results, fields) {
      if (error) throw error;
      res.send(results);
    });

  }
  catch (exception_var) {
    console.log("Error");
  }
})

app.get('/like', (req, res) => {
  let picid = req.query.picid;
  let userid = req.query.userid;
  let likedata = {photo_id: picid, username: userid} 


  try {
    connection.query(`SELECT count(*) as occurrences FROM likes WHERE photo_id ='${picid}' AND username='${userid}';`, function (error, results, fields) {
    if (error) throw error;      
      if(results[0].occurrences == 0) {
        
        connection.query(`UPDATE photos SET likes = likes + 1 WHERE id ='${picid}';`, function (error, results, fields) {
          if (error) throw error;            
          });

          connection.query(`INSERT INTO likes SET ?;`, likedata, function (error, results, fields) {
            if (error) throw error;            
            });
            res.send('Liked')
      } else {
        connection.query(`UPDATE photos SET likes = likes - 1 WHERE id ='${picid}';`, function (error, results, fields) {
          if (error) throw error;            
          });

          connection.query(`DELETE FROM likes WHERE photo_id ='${picid}' AND username='${userid}';`, function (error, results, fields) {
            if (error) throw error;            
            });
            res.send('UnLiked')
      }

    });

  }
  catch (exception_var) {
    console.log("Error");
  }
})



// ****************************************
// ****************************************
// ****       Favorites API's          ****
// ****************************************
// ****************************************

app.get('/favcheck', (req, res) => {
  let picid = req.query.picid;
  let userid = req.query.userid;
  try {
    connection.query(`SELECT count(*) as occurrences FROM favorites WHERE photo_id ='${picid}' AND user='${userid}';`, function (error, results, fields) {
      if (error) throw error;
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }
})

app.get('/addfav', (req, res) => {
  let picid = req.query.picid;
  let userid = req.query.userid;

  let sqldata = {
    photo_id: req.query.picid,
    user: req.query.userid
  }
  try {
    connection.query(`SELECT count(*) as occurrences FROM favorites WHERE photo_id ='${picid}' AND user='${userid}';`, function (error, results, fields) {
      if (error) throw error;
      
        if(results[0].occurrences == 0) {
          connection.query(`INSERT INTO favorites SET ?;`, sqldata , function (error, results, fields) {
            if (error) throw error;
            res.send("Added");
          });
        } else{

          connection.query(`DELETE FROM favorites WHERE photo_id ='${picid}' AND user='${userid}';`, function (error, results, fields) {
            if (error) throw error;
            res.send('Removed');
          });
        }
    });

  }
  catch (exception_var) {
    console.log("Error");
  }
})

app.get('/myfavs', (req, res) => {
  try {
    let user = req.query.user;
    connection.query(`SELECT * FROM photos JOIN favorites ON photos.id = favorites.photo_id WHERE favorites.user = '${user}';`, function (error, results, fields) {
      if (error) throw error;
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }

 })


// ****************************************
// ****************************************
// ****       Top 50 List API's        ****
// ****************************************
// ****************************************

 app.get('/topfavs', (req, res) => {
    try {
      let user = req.query.user;
      //connection.query(`SELECT * FROM photos JOIN favorites ON photos.id = favorites.photo_id WHERE favorites.user = '${user}';`, function (error, results, fields) {
        connection.query(`SELECT photo_id, count(*) as favorite, photos.id, photos.lat, photos.lng FROM favorites JOIN photos ON favorites.photo_id = photos.id GROUP BY favorites.photo_id ORDER BY favorite DESC Limit 10`, function (error, results, fields) {
        if (error) throw error;
        res.send(results);
      });
    }
    catch (exception_var) {
      console.log("Error");
    }
 })


 app.get('/toplikes', (req, res) => {
  try {
    let user = req.query.user;
    connection.query(`SELECT * FROM photos  WHERE status=1 ORDER by likes desc limit 10;`, function (error, results, fields) {
      if (error) throw error;
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }
})

app.get('/topviews', (req, res) => {
  try {
    let user = req.query.user;
    connection.query(`SELECT * FROM photos  WHERE status=1 ORDER by views desc limit 10;`, function (error, results, fields) {
      if (error) throw error;
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }
})



// ******************************************************************************************************************************************************************************
// ******************************************************************************************************************************************************************************
// ******************************************************************************************************************************************************************************
// ************************************************-------------------------------------------------------------------------------------*****************************************
// ***********************************************|                                  Photo Comments                                     |****************************************
// ************************************************--------------------------------------------------------------------------------------****************************************
// ******************************************************************************************************************************************************************************
// ******************************************************************************************************************************************************************************
// ******************************************************************************************************************************************************************************

app.get('/comments', (req, res) => {
  let photo_id = req.query.id
  try {
    let user = req.query.user;
    connection.query(`SELECT * FROM comments WHERE photo_id = '${photo_id}'  ORDER by id desc;`, function (error, results, fields) {
      if (error) throw error;
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }
})

app.post('/likecomments', (req, res) => {
  let comment_id = req.query.id
  try {
    connection.query(`UPDATE comments SET likes = likes + 1 WHERE id = '${comment_id}'  ORDER by id desc;`, function (error, results, fields) {
      if (error) throw error;
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }
})

app.post('/comments', (req, res) => {
  let comment = req.body
  try {
    connection.query(`INSERT INTO comments SET ?`, comment , function (error, results, fields) {
      if (error) throw error;
      res.send(results);
    });
  }
  catch (exception_var) {
    console.log("Error");
  }
})





app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})