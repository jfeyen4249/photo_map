// ****************************************
// ****************************************
// ****       Global Variables         ****
// ****************************************
// ****************************************
//import exifr from './node_modules/exifr/dist/lite.esm.js'

var zoomLock = false;                               //map lock for on.map drag and zoom functions
const buttonBox = document.getElementById('box') ;   //Menubar box
const gpsbutton = document.getElementById('footer-btn') ;
let uploadbox = document.getElementById("addfile");
let latlng = document.getElementById("latlng");
let title = document.getElementById("titlebox");
let camera = document.getElementById("camera");
let lens = document.getElementById("lens");
let shutter = document.getElementById("shutter");
let iso = document.getElementById("iso");
let fstop = document.getElementById("fstop");
let cat = document.getElementById("cat");
let info = document.getElementById("infobox");
let sbox = document.querySelector('.sbox');

let loaded_id = [];
let picCounter = 0;
let picView = false;
let picid = ""

let uploadfile = document.getElementById('files');
var addPic = {lat: "", lng: ""}
var setLocation = false
const myHeaders = new Headers();
myHeaders.append('Content-Type', 'application/json');
myHeaders.append('Authorization', `Bearer ${sessionStorage.getItem('token')}`);

let activeSearch = false


// ****************************************
// ****************************************
// ****       Keyboard Listener        ****
// ****************************************
// ****************************************


window.addEventListener("keydown", function (event) {
    
    if (event.code == 'ArrowRight') {
        nextpic()
    } 


    if (event.code == 'ArrowLeft') {
        lastpic()
      } 

      if (event.code == 'Escape') {
        // Handle the event with KeyboardEvent.key
        closePhoto();
      } 

  });



// **********************************************************************************************************************************
// **********************************************************************************************************************************
// ****                                       Faction Converstion for Exif Data                                                  ****
// **********************************************************************************************************************************
// **********************************************************************************************************************************

  Fraction = function(numerator, denominator)
  {
      /* double argument invocation */
      if (numerator && denominator) {
          if (typeof(numerator) === 'number' && typeof(denominator) === 'number') {
              this.numerator = numerator;
              this.denominator = denominator;
          } else if (typeof(numerator) === 'string' && typeof(denominator) === 'string') {
              // what are they?
              // hmm....
              // assume they are ints?
              this.numerator = parseInt(numerator);
              this.denominator = parseInt(denominator);
          }
      /* single-argument invocation */
      } else if (!denominator) {
          num = numerator; // swap variable names for legibility
          if (typeof(num) === 'number') {  // just a straight number init
              this.numerator = num;
              this.denominator = 1;
          } else if (typeof(num) === 'string') {
              var a, b;  // hold the first and second part of the fraction, e.g. a = '1' and b = '2/3' in 1 2/3
                         // or a = '2/3' and b = undefined if we are just passed a single-part number
              [a, b] = num.split(' ');
              /* compound fraction e.g. 'A B/C' */
              //  if a is an integer ...
              if (a % 1 === 0 && b && b.match('/')) {
                  return (new Fraction(a)).add(new Fraction(b));
              } else if (a && !b) {
                  /* simple fraction e.g. 'A/B' */
                  if (typeof(a) === 'string' && a.match('/')) {
                      // it's not a whole number... it's actually a fraction without a whole part written
                      var f = a.split('/');
                      this.numerator = f[0]; this.denominator = f[1];
                  /* string floating point */
                  } else if (typeof(a) === 'string' && a.match('\.')) {
                      return new Fraction(parseFloat(a));
                  /* whole number e.g. 'A' */
                  } else { // just passed a whole number as a string
                      this.numerator = parseInt(a);
                      this.denominator = 1;
                  }
              } else {
                  return undefined; // could not parse
              }
          }
      }
      this.normalize();
  }
  
  
  Fraction.prototype.clone = function()
  {
      return new Fraction(this.numerator, this.denominator);
  }
  
  
  /* pretty-printer, converts fractions into whole numbers and fractions */
  Fraction.prototype.toString = function()
  {
      var wholepart = Math.floor(this.numerator / this.denominator);
      var numerator = this.numerator % this.denominator 
      var denominator = this.denominator;
      var result = [];
      if (wholepart != 0) 
          result.push(wholepart);
      if (numerator != 0)  
          result.push(numerator + '/' + denominator);
      return result.length > 0 ? result.join(' ') : 0;
  }
  
  
  /* destructively rescale the fraction by some integral factor */
  Fraction.prototype.rescale = function(factor)
  {
      this.numerator *= factor;
      this.denominator *= factor;
      return this;
  }
  
  
  Fraction.prototype.add = function(b)
  {
      var a = this.clone();
      if (b instanceof Fraction) {
          b = b.clone();
      } else {
          b = new Fraction(b);
      }
      td = a.denominator;
      a.rescale(b.denominator);
      b.rescale(td);
  
      a.numerator += b.numerator;
  
      return a.normalize();
  }
  
  
  Fraction.prototype.subtract = function(b)
  {
      var a = this.clone();
      if (b instanceof Fraction) {
          b = b.clone();  // we scale our argument destructively, so clone
      } else {
          b = new Fraction(b);
      }
      td = a.denominator;
      a.rescale(b.denominator);
      b.rescale(td);
  
      a.numerator -= b.numerator;
  
      return a.normalize();
  }
  
  
  Fraction.prototype.multiply = function(b)
  {
      var a = this.clone();
      if (b instanceof Fraction)
      {
          a.numerator *= b.numerator;
          a.denominator *= b.denominator;
      } else if (typeof b === 'number') {
          a.numerator *= b;
      } else {
          return a.multiply(new Fraction(b));
      }
      return a.normalize();
  }
  
  Fraction.prototype.divide = function(b)
  {
      var a = this.clone();
      if (b instanceof Fraction)
      {
          a.numerator *= b.denominator;
          a.denominator *= b.numerator;
      } else if (typeof b === 'number') {
          a.denominator *= b;
      } else {
          return a.divide(new Fraction(b));
      }
      return a.normalize();
  }
  
  Fraction.prototype.equals = function(b)
  {
      if (!(b instanceof Fraction)) {
          b = new Fraction(b);
      }
      // fractions that are equal should have equal normalized forms
      var a = this.clone().normalize();
      var b = b.clone().normalize();
      return (a.numerator === b.numerator && a.denominator === b.denominator);
  }
  
  
  /* Utility functions */
  
  /* Destructively normalize the fraction to its smallest representation. 
   * e.g. 4/16 -> 1/4, 14/28 -> 1/2, etc.
   * This is called after all math ops.
   */
  Fraction.prototype.normalize = (function()
  {
  
      var isFloat = function(n)
      {
          return (typeof(n) === 'number' && 
                  ((n > 0 && n % 1 > 0 && n % 1 < 1) || 
                   (n < 0 && n % -1 < 0 && n % -1 > -1))
                 );
      }
  
      var roundToPlaces = function(n, places) 
      {
          if (!places) {
              return Math.round(n);
          } else {
              var scalar = Math.pow(10, places);
              return Math.round(n*scalar)/scalar;
          }
      }
          
      return (function() {
  
          // XXX hackish.  Is there a better way to address this issue?
          //
          /* first check if we have decimals, and if we do eliminate them
           * multiply by the 10 ^ number of decimal places in the number
           * round the number to nine decimal places
           * to avoid js floating point funnies
           */
          if (isFloat(this.denominator)) {
              var rounded = roundToPlaces(this.denominator, 9);
              var scaleup = Math.pow(10, rounded.toString().split('.')[1].length);
              this.denominator = Math.round(this.denominator * scaleup); // this !!! should be a whole number
              //this.numerator *= scaleup;
              this.numerator *= scaleup;
          } 
          if (isFloat(this.numerator)) {
              var rounded = roundToPlaces(this.numerator, 9);
              var scaleup = Math.pow(10, rounded.toString().split('.')[1].length);
              this.numerator = Math.round(this.numerator * scaleup); // this !!! should be a whole number
              //this.numerator *= scaleup;
              this.denominator *= scaleup;
          }
          var gcf = Fraction.gcf(this.numerator, this.denominator);
          this.numerator /= gcf;
          this.denominator /= gcf;
          if ((this.numerator < 0 && this.denominator < 0) || (this.numerator > 0 && this.denominator < 0)) {
              this.numerator *= -1;
              this.denominator *= -1;
          }
          return this;
      });
  
  })();
  
  
  /* Takes two numbers and returns their greatest common factor.
   */
  Fraction.gcf = function(a, b)
  {
  
      var common_factors = [];
      var fa = Fraction.primeFactors(a);
      var fb = Fraction.primeFactors(b);
      // for each factor in fa
      // if it's also in fb
      // put it into the common factors
      fa.forEach(function (factor) 
      { 
          var i = fb.indexOf(factor);
          if (i >= 0) {
              common_factors.push(factor);
              fb.splice(i,1); // remove from fb
          }
      });
  
      if (common_factors.length === 0)
          return 1;
  
      var gcf = (function() {
          var r = common_factors[0];
          var i;
          for (i=1;i<common_factors.length;i++)
          {
              r = r * common_factors[i];
          }
          return r;
      })();
  
      return gcf;
  
  };
  
  

  Fraction.primeFactors = function(n) 
  {
  
      var num = Math.abs(n);
      var factors = [];
      var _factor = 2;  // first potential prime factor
  
      while (_factor * _factor <= num)  // should we keep looking for factors?
      {      
        if (num % _factor === 0)  // this is a factor
          { 
              factors.push(_factor);  // so keep it
              num = num/_factor;  // and divide our search point by it
          }
          else
          {
              _factor++;  // and increment
          }
      }
  
      if (num != 1)                    // If there is anything left at the end...
      {                                // ...this must be the last prime factor
          factors.push(num);           //    so it too should be recorded
      }
  
      return factors;                  // Return the prime factors
  }









// ****************************************
// ****************************************
// ****          Map Setup             ****
// ****************************************
// ****************************************
//var map = L.map('map').setView([40.463666324587685, -100.32714843749999], 5);
var map = L.map('map').setView([42.51152614595525, -90.39482116699217], 15, draggable = false);


mapLink = '<a href="https://openstreetmap.org"></a>'
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '' + mapLink,
    maxZoom: 19,
    noWrap: true }).addTo(map);
    var iconOptions = {
        iconUrl: 'icon.png',
        iconSize: [50, 50],
        iconAnchor: [25, 45],
     }
     // Creating a custom icon
     var customIcon = L.icon(iconOptions);
     // Creating Marker Options
     var markerOptions = {
        title: "",
        clickable: true,
        draggable: false,
        icon: customIcon
     }
    var myFeatureGroup = L.featureGroup().addTo(map).on("click", groupClick);

    if (performance.navigation.type == performance.navigation.TYPE_RELOAD && sessionStorage.getItem('username') !== null && sessionStorage.getItem('token') == null) {
        sessionStorage.clear();
      }

// ****************************************
// ****************************************
// ****       Map.on functions         ****
// ****************************************
// ****************************************

// Prevents map from loading markers when there is not a logged in user.
map.on('dragend', function(ev) {
    if(sessionStorage.getItem('username') !== null && setLocation == false){
        loadMarkers();
    }
});
// Prevents map from loading markers when there is not a logged in user.
map.on('zoomend', function(ev) {
    if(sessionStorage.getItem('username') !== null && setLocation == false){
        loadMarkers();
        console.log(map.getZoom())
    }
});
// Logs where a user clicked on the map.
map.on('click', function(ev) {
    const mapLat = ev.latlng.lat.toString()
    const mapLng = ev.latlng.lng.toString()
    addPic.lat = mapLat
    addPic.lng = mapLng
    console.log('Map clicked: ' + mapLat + ' : ' +  mapLng)
    if(setLocation == true && document.getElementsByClassName('add-box')[0].style.display == "none") {
        myFeatureGroup.clearLayers();
        L.marker([mapLat, mapLng], markerOptions).addTo(myFeatureGroup).bindPopup("")
        console.log('Location Selected: ' + addPic.lat + ' - ' + addPic.lng)
    }
});

map.on('dblclick', function(ev) {
    preventDefault()
})

map.on('keydown', function(ev) {
    ev.map.zoomLock = true
    map.dragging.disable();
    console.log("Key")
})

// Prevents map from being dragged when hovering over the top buttons
// buttonBox.addEventListener('mouseover', () => {
//     zoomLock = true
//     map.on("zoomstart", function(e) {if(zoomLock){throw 'zoom disabled';}});
// })
// Prevents map from being dragged when hovering over the top buttons
buttonBox.addEventListener('mouseleave', () => {
    zoomLock = false
    map.on("dreagend", function(e) {if(zoomLock){throw 'zoom disabled';}});
})

gpsbutton.addEventListener('mouseover', () => {
    zoomLock = true
    map.on("zoomstart", function(e) {if(zoomLock){throw 'zoom disabled';}});
    setLocation = false
    
})
// Prevents map from being dragged when hovering over the top buttons
gpsbutton.addEventListener('mouseleave', () => {
    zoomLock = false
    map.on("dreagstart", function(e) {if(zoomLock){throw 'zoom disabled';}});
    setLocation = true
})


// ****************************************
// ****************************************
// ****       Shared functions         ****
// ****************************************
// ****************************************

function clearMap() {
    myFeatureGroup.clearLayers();
    picCounter = 0
    loaded_id = []
}

// This function is use to calulate the radius for the center of the map to the outer edge.
// That number is used to load markers with in the radius displayed on the screen.
function getDistance(lat, lon, lat2, long2) {
    //6371
    var R = 5571;
    var dLat = (lat2-lat) * Math.PI / 180;
    var dLon = (long2-lon) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d; }     

function loadMarkers() {
    if(activeSearch == true) {
        return
    } else {
        //Markers get cleared before fetching the new markers
    myFeatureGroup.clearLayers();
    //The radius of the current view is calculated 
    loaded_id = []
    picCounter = 0
    let mapRadius = getDistance(map.getCenter().lat, map.getCenter().lng, map.getCenter().lat, map.getBounds().getEast().toString());
    // The makers are loaded if the radius is less than 600
    let zoomlevel = map.getZoom();
    if(mapRadius <= 600  && setLocation == false) {

        if(zoomlevel >= 16) {
            document.getElementsByClassName('footer')[0].style.display = "none";
            let MyURL = `/markers?lat=${map.getCenter().lat}&lng=${map.getCenter().lng}&radius=${Math.floor(30)}`
            fetch(MyURL)
            .then(response => response.json())
            .then(data => {
                for(var i = 0; i < data.length; i++) {
                    var obj = data[i];
                    var marker, test;
                    test = obj.id;
                    marker = L.marker([obj.lat, obj.lng], markerOptions).addTo(myFeatureGroup).bindPopup("");
                    marker.test = test;
                    loaded_id.push(obj.id)
                }
            });
        }else {
            document.getElementsByClassName('footer')[0].style.display = "none";
            let MyURL = `/markers?lat=${map.getCenter().lat}&lng=${map.getCenter().lng}&radius=${Math.floor(mapRadius)}`
            fetch(MyURL, {headers: myHeaders})
            .then(response => response.json())
            .then(data => {
           
                for(var i = 0; i < data.length; i++) {
                    var obj = data[i];
                    var marker, test;
                    test = obj.id;
                    marker = L.marker([obj.lat, obj.lng], markerOptions).addTo(myFeatureGroup).bindPopup("");
                    marker.test = test;
                    loaded_id.push(obj.id)
                }
            });
    }
    } else {
        //The user is told to zoom in if the radius is more that 600
         document.getElementsByClassName('footer')[0].style.display = "block";
    }
    }








} 

    function blockClick(event) {
        event.stopPropagation()
        
    }

// ****************************************
// ****************************************
// ****       Marker functions         ****
// ****************************************
// ****************************************

// This function loads the image, and details from the marker that was clicked.
function groupClick(event) {
    // The top menu bar is hidden.
    document.getElementsByClassName('box')[0].style.display = "none";
    // The derails are fetched and displayed to the user.
    console.log(event.layer.test)
    fetch(`/info?id=${event.layer.test}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        //console.log(data[0]);
        closeSearh()
        document.getElementById('keyword-tag').innerHTML = ''
        
        document.getElementById('pic-title').innerHTML = data[0].title
        document.getElementById('info').innerHTML = data[0].info
        document.getElementsByClassName('view-photo')[0].style.display = "flex";
        document.getElementsByClassName('photo')[0].style.backgroundImage = `url('/img/${data[0].filename}')`;
        
        document.getElementById('camera-body').innerHTML = data[0].camera
        document.getElementById('camera-lens').innerHTML = data[0].lens

        let keywords = data[0].tags.split(",") 

        if(keywords.length >1) {     
            for(i=0; i<keywords.length; i++) {
                document.getElementById('keyword-tag').innerHTML += `<p class="keyword-tags">${keywords[i]}</p>`
            }
        }

        document.getElementById('camera-iso').innerHTML = 'ISO ' +data[0].iso
        document.getElementById('camera-fstop').innerHTML = data[0].aperture
        document.getElementById('likes').innerHTML = data[0].likes
        document.getElementById('camera-shutter').innerHTML = data[0].shutter
        
        picView = true
        document.getElementById('cloes-btn').focus()
        map.scrollWheelZoom.disable();
        L.DomEvent.stopPropagation(document.getElementById('map'));
    });

    fetch(`/likecheck?picid=${event.layer.test}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        if(data[0].occurrences !== 0) {
            document.getElementById('like-btn').classList.add('btn-like')
        }
    });

    fetch(`/favcheck?picid=${event.layer.test}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        if(data[0].occurrences !== 0) {
            document.getElementById('favorite-btn').classList.add('btn-favorite')
        }
    });
    picid =  event.layer.test

}




// ****************************************
// ****************************************
// ****      Security Functions        ****
// ****************************************
// ****************************************

// Checking for a User's session 
if(sessionStorage.getItem('username') == 'guest' && sessionStorage.getItem('token') == null) {
    document.getElementsByClassName('login-box')[0].style.display = "none";
    sessionStorage.setItem('username', 'guest');
    document.getElementsByClassName('box')[0].style.display = "none";
    alert("To get back to the login close the page and come back")
    loadMarkers();

}else if(sessionStorage.getItem('username') == null && sessionStorage.getItem('token') == null){
    document.getElementsByClassName('login-box')[0].style.display = "block";
    document.getElementsByClassName('box')[0].style.display = "none";
    document.getElementsByClassName('footer')[0].style.display = "none";
    document.getElementById('login_box').focus()
} else {
    loadMarkers();
    document.getElementsByClassName('login-box')[0].style.display = "none";
    document.getElementsByClassName('box')[0].style.display = "block";
}

// ****************************************
// ****************************************
// ****      Security Functions        ****
// ****************************************
// ****************************************

async function login() {
    // const formData = new FormData();
    // formData.append("Content-Type", "application/json")
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    let data = JSON.stringify({username: username, password: password})

    if(username == '') {
        alert('Please enter a username')
        return
    }  

    if(password == '') {
        alert('Please enter a password');
        return
    }  

    fetch("/login", {
        method: 'POST',
        body: data,
        headers: {'Content-Type': 'application/json;charset=utf-8'}
    })
    .then(response => response.json())
    .then(data => {
        if(data.status == "pass"){
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('token', data.token);
            window.location.reload();
        } else {
            alert("Incorrect username or password!");
        }
     });
}

function guest() {
    document.getElementsByClassName('login-box')[0].style.display = "none";
    sessionStorage.setItem('username', 'guest');

    fetch("/guest", {
        method: 'POST',
    })
    .then(response => response.text())
    .then(data => {

     });
    loadMarkers();
}

function closeSearh() {
    sbox.classList.remove("active")
}

function logout() {
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("token");
    window.location.reload();
}

// ****************************************
// ****************************************
// ****       Button Functions         ****
// ****************************************
// ****************************************

// This function show the user their own photos that were posted. It also give them editing right when the click a on their photo.
function myphotos() {
    activeSearch = true
    map.setZoom(4);
    clearMap()
    
    let MyURL = `/myphotos?user=${sessionStorage.getItem('username')}`
            fetch(MyURL, {headers: myHeaders})
            .then(response => response.json())
            .then(data => {
           
                for(var i = 0; i < data.length; i++) {
                    var obj = data[i];
                    var marker, test;
                    test = obj.id;
                    marker = L.marker([obj.lat, obj.lng], markerOptions).addTo(myFeatureGroup).bindPopup("");
                    marker.test = test;
                    loaded_id.push(obj.id)
                }
            });
    document.getElementsByClassName('footer')[0].style.display = "block";
    document.getElementById('footer-text').style.display = "none"
    document.getElementById('footer-btn').style.display = "none"
    document.getElementById('footer-btn-search').style.display = "block"
    
}

function lastpic() {
    if(picCounter == 0) {
     picCounter = loaded_id.length -1
    } else {
     picCounter = picCounter - 1
    }
     // The derails are fetched and displayed to the user.
     fetch(`/info?id=${loaded_id[picCounter]}`, {headers: myHeaders})
     .then(response => response.json())
     .then(data => {
         document.getElementById('keyword-tag').innerHTML = ''
         document.getElementById('pic-title').innerHTML = data[0].title
         document.getElementById('info').innerHTML = data[0].info
         document.getElementsByClassName('photo')[0].style.backgroundImage = `url('/img/${data[0].filename}')`;
         document.getElementById('camera-body').innerHTML = data[0].camera
         document.getElementById('camera-lens').innerHTML = data[0].lens
  
         document.getElementById('camera-iso').innerHTML = 'ISO ' +data[0].iso
         document.getElementById('camera-fstop').innerHTML = data[0].aperture
         document.getElementById('camera-shutter').innerHTML = data[0].shutter
     });

     
    fetch(`/likecheck?picid=${event.layer.test}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        if(data[0].occurrences !== 0) {
            document.getElementById('like-btn').classList.add('btn-like')
        }
    });

    fetch(`/favcheck?picid=${event.layer.test}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        if(data[0].occurrences !== 0) {
            document.getElementById('favorite-btn').classList.add('btn-favorite')
        }
    });
 }

function nextpic() {
   if(picCounter>=0) {
    picCounter++
   }

   if(picCounter == loaded_id.length -1) {
    picCounter = 0 
   }
    // The derails are fetched and displayed to the user.
    fetch(`/info?id=${loaded_id[picCounter]}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        document.getElementById('keyword-tag').innerHTML = ''
        document.getElementById('pic-title').innerHTML = data[0].title
        document.getElementById('info').innerHTML = data[0].info
        document.getElementsByClassName('photo')[0].style.backgroundImage = `url('/img/${data[0].filename}')`;
        document.getElementById('camera-body').innerHTML = data[0].camera
        document.getElementById('camera-lens').innerHTML = data[0].lens
 
        document.getElementById('camera-iso').innerHTML = 'ISO ' +data[0].iso
        document.getElementById('camera-fstop').innerHTML = data[0].aperture
        document.getElementById('camera-shutter').innerHTML = data[0].shutter
    });

    
    fetch(`/likecheck?picid=${event.layer.test}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        if(data[0].occurrences !== 0) {
            document.getElementById('like-btn').classList.add('btn-like')
        }
    });

    fetch(`/favcheck?picid=${event.layer.test}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        if(data[0].occurrences !== 0) {
            document.getElementById('favorite-btn').classList.add('btn-favorite')
        }
    });
}

// This function closes the photo box.
function closePhoto() {
    if(sessionStorage.getItem('username') == 'guest'&& sessionStorage.getItem('token') == null) {
        document.getElementsByClassName('view-photo')[0].style.display = "none";
    }else{
         // The photo box is hidded.
        document.getElementsByClassName('view-photo')[0].style.display = "none";
        // The top menubar is displayed to the user.
        document.getElementsByClassName('box')[0].style.display = "block";
        closeSearh()
        picView = false
        document.getElementById('like-btn').classList.remove('btn-like')
        document.getElementById('favorite-btn').classList.remove('btn-favorite')
        map.scrollWheelZoom.enable();
        picid = ""
    }
}

function disableSearch() {
    activeSearch = false
    document.getElementsByClassName('footer')[0].style.display = "none";
    document.getElementById('footer-text').style.display = "none"
    document.getElementById('footer-btn').style.display = "none"
    document.getElementById('footer-btn-search').style.display = "none"
    clearMap()
    map.setZoom(12)
}

// This function show the users the photos that they have marked at their favorite.
function myfavs() {
   
    activeSearch = true
    map.setZoom(4);
    clearMap()
    
    let MyURL = `/myfavs?user=${sessionStorage.getItem('username')}`
            fetch(MyURL, {headers: myHeaders})
            .then(response => response.json())
            .then(data => {
           
                for(var i = 0; i < data.length; i++) {
                    var obj = data[i];
                    var marker, test;
                    test = obj.id;
                    marker = L.marker([obj.lat, obj.lng], markerOptions).addTo(myFeatureGroup).bindPopup("");
                    marker.test = test;
                    loaded_id.push(obj.id)
                }
            });
    document.getElementsByClassName('footer')[0].style.display = "block";
    document.getElementById('footer-text').style.display = "none"
    document.getElementById('footer-btn').style.display = "none"
    document.getElementById('footer-btn-search').style.display = "block"

}

async function mysearch() {
    
    sbox.classList.toggle("active")
    var frac = new Fraction( 0.002);
    console.log(frac.toString());

}

function signup() {
    alert("Sign Up is not enabled at this time. This site is still a work in progress.")
}

function like() {
    //like?picid=43&user=jfeyen
    let likecount = Number(document.getElementById('likes').innerHTML)
    console.log (likecount + 1)
    fetch(`/like?picid=${picid}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.text())
    .then(data => {
        console.log(data)
        if(data == "Liked") {
            document.getElementById('like-btn').classList.add('btn-like')
            document.getElementById('likes').innerHTML = likecount + 1
        }else if (data == "UnLiked") {
            document.getElementById('like-btn').classList.remove('btn-like')
            document.getElementById('likes').innerHTML = likecount - 1
        }
    });
}

function addfav() {
    console.log(document.getElementById('picid').innerHTML)
    fetch(`/addfav?picid=${picid}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.text())
    .then(data => {
        if(data == "Added") {
            document.getElementById('favorite-btn').classList.add('btn-favorite')
        }else if (data == "Removed") {
            document.getElementById('favorite-btn').classList.remove('btn-favorite')
        }
    });
}

//document.getElementById('picid').innerHTML = event.layer.test

// ****************************************
// ****************************************
// ****    Adding a photo functions    ****
// ****************************************
// ****************************************

function addphotosopen() {
    document.getElementsByClassName('add-box')[0].style.display = "block";
    document.getElementsByClassName('box')[0].style.display = "none";
    uploadbox.style.backgroundColor = "red"
    LoadAddCat()
}

function addphotosclose() {
    document.getElementsByClassName('add-box')[0].style.display = "none";
    document.getElementsByClassName('box')[0].style.display = "block";
    document.getElementById('likebutton').style.color = "black"
    setLocation = false
    loadMarkers();
}

async function uploadPic() {
    const formData = new FormData();
    formData.append("photo", files.files[0]);
    
    fetch("/upload", {
        method: 'post',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        sessionStorage.setItem("AddPic", data.image)
        document.getElementById('image').style.backgroundImage = `url(/img/${data.image})`
        uploadbox.style.backgroundColor = "green";
        latlng.style.backgroundColor = "red"
     });
}

function setMapMarker() { 
    document.getElementsByClassName('add-box')[0].style.display = "none"
    document.getElementById('footer-text').style.display = "none"
    document.getElementById('footer-btn').style.display = "block"
    document.getElementById('footer').style.display = "block"
    $('.leaflet-container').css("cursor" , "crosshair");
    setLocation = true
}

function saveMapMarker() {
    document.getElementById('lat').innerText = addPic.lat;
    document.getElementById('lng').innerText = addPic.lng;
    document.getElementById('footer-text').style.display = "block"
    document.getElementById('footer-btn').style.display = "none"
    document.getElementById('footer-btn').style.display = "none"
    document.getElementsByClassName('add-box')[0].style.display = "block"
    latlng.style.backgroundColor = "green"
    title.style.backgroundColor = "red"
    camera.style.backgroundColor = "red"
    lens.style.backgroundColor = "red"
    shutter.style.backgroundColor = "red"
    iso.style.backgroundColor = "red"
    fstop.style.backgroundColor = "red"
    cat.style.backgroundColor = "red"
    info.style.backgroundColor = "red"
    $('.leaflet-container').css("cursor" , "-webkit-grab");
    setLocation = false
}

async function LoadAddCat() {
    var select = document.getElementById("catSelect");
    select.options[select.options.length] = new Option("Select a Category", "Select a Category")
    return fetch('/cat', {
        method: 'GET',
        headers: myHeaders,
      })
      .then(response => response.json())
      .then(data => {
          console.log(data);
         for(let i = 0; i < data.length; i++) {
            let obj = data[i]
            select.options[select.options.length] = new Option(obj.category, obj.category);
         }  
      });
}

async function SaveImage() {
    let key = document.querySelectorAll('.multi-search-item')
    let dataword = ""
    for(i=0; i<key.length; i++) {
        let word = key[i].outerText
        dataword += `${word},`
    }
    dataword =  dataword.substring(0,dataword.length-1)


    let data = JSON.stringify({
        filename: sessionStorage.getItem('AddPic'), 
        title: document.getElementById("title").value,
        camera: document.getElementById("cameratext").value,
        lens: document.getElementById("lenstext").value,
        shutter: document.getElementById("shuttertext").value,
        iso: document.getElementById("isotext").value,
        fstop: document.getElementById("fstoptext").value,
        tags: dataword,
        category: document.getElementById("catSelect").value,
        info: document.getElementById("infotext").value,
        lat:  document.getElementById('lat').innerText,
        lng: document.getElementById('lng').innerText,
        username: sessionStorage.getItem('username')
    })

    console.log(data)

    fetch("/picsave", {
        method: 'POST',
        body: data,
        headers: myHeaders
    })
    .then(response => response.json())
    .then(data => {
        if(data.message == "Saved"){ 
            sessionStorage.removeItem('AddPic')
            window.location.reload()
        }else{
            alert("Failed to save!")
        }
     });
}

function PicLike() {
    if(document.getElementById('likebutton').style.color = "black") {
        document.getElementById('likebutton').style.color = "red"
    }else if(document.getElementById('likebutton').style.color = "red") {
        document.getElementById('likebutton').style.color = "black"
    }
}
 
//  Keyword Tags
let btn = document.getElementById('btn')
let key = document.querySelectorAll('.multi-search-item')

function multiSearchKeyup(inputElement) {
if(event.keyCode === 13) {
    inputElement.parentNode
        .insertBefore(createFilterItem(inputElement.value), inputElement);
    inputElement.value = "";
}
function createFilterItem(text) {
    const item = document.createElement("div");
    item.setAttribute("class", "multi-search-item");
    const span = `<span>${text}</span>`;
    const close = `<div class="fa fa-close" onclick="this.parentNode.remove()"></div>`;
    item.innerHTML = span+close;
    return item;
}

btn.onclick = function() {
    let key = document.querySelectorAll('.multi-search-item')
    // console.log(key)
    
    for(i=0; i<key.length; i++) {
        let word = key[i].outerText
        console.log(word)
    }
}

}