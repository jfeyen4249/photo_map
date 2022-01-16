// ****************************************
// ****************************************
// ****       Global Variables         ****
// ****************************************
// ****************************************


var zoomLock = false;                               //map lock for on.map drag and zoom functions
const buttonBox = document.getElementById('box') ;   //Menubar box
const addBox = document.getElementById('GPSselect') ;
let uploadbox = document.getElementById("addfile");
let latlng = document.getElementById("latlng");
let title = document.getElementById("title");
let uploadfile = document.getElementById('files');
let markerSet = false;
const myHeaders = new Headers();
myHeaders.append('Content-Type', 'application/json');
myHeaders.append('Authorization', `Bearer ${sessionStorage.getItem('token')}`);

// ****************************************
// ****************************************
// ****          Map Setup             ****
// ****************************************
// ****************************************
var map = L.map('map').setView([40.463666324587685, -100.32714843749999], 5);
mapLink = '<a href="https://openstreetmap.org"></a>'
L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '' + mapLink,
    maxZoom: 18,
    noWrap: true
    }).addTo(map);
    
    var iconOptions = {
        iconUrl: 'icon.png',
        iconSize: [50, 50]
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

// ****************************************
// ****************************************
// ****       Map.on functions         ****
// ****************************************
// ****************************************

// Prevents map from loading markers when there is not a logged in user.
map.on('dragend', function(ev) {
    if(sessionStorage.getItem('username') !== null){
        loadMarkers();
    }
});
// Prevents map from loading markers when there is not a logged in user.
map.on('zoomend', function(ev) {
    if(sessionStorage.getItem('username') !== null){
        loadMarkers();
        console.log(map.getZoom())
    }
});
// Logs where a user clicked on the map.
map.on('click', function(ev) {
    const mapLat = ev.latlng.lat.toString()
    const mapLng = ev.latlng.lng.toString()
    if(markerSet == true) {
        const setLat = mapLat;
        const setLng = mapLng;
        console.log(setLat + " | " + setLng)
        document.getElementById('lat').innerText= setLat
        document.getElementById('lng').innerText= setLng
        document.getElementsByClassName('add-box')[0].style.display = "block";
        markerSet = false;
    }
});

// Prevents map from being dragged when hovering over the top buttons
buttonBox.addEventListener('mouseover', () => {
    zoomLock = true
    map.on("zoomstart", function(e) {if(zoomLock){throw 'zoom disabled';}});
})
// Prevents map from being dragged when hovering over the top buttons
buttonBox.addEventListener('mouseleave', () => {
    zoomLock = false
    map.on("dreagend", function(e) {if(zoomLock){throw 'zoom disabled';}});
})


// ****************************************
// ****************************************
// ****       Shared functions         ****
// ****************************************
// ****************************************

// This function is use to calulate the radius for the center of the map to the outer edge.
// That number is used to load markers with in the radius displayed on the screen.
function getDistance(lat, lon, lat2, long2) {
    var R = 6371;
    var dLat = (lat2-lat) * Math.PI / 180;
    var dLon = (long2-lon) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d; }     

function loadMarkers() {
    //Markers get cleared before fetching the new markers
    myFeatureGroup.clearLayers();
    //The radius of the current view is calculated 

    let mapRadius = getDistance(map.getCenter().lat, map.getCenter().lng, map.getCenter().lat, map.getBounds().getEast().toString());
    // The makers are loaded if the radius is less than 600
    let zoomlevel = map.getZoom();
    if(mapRadius <= 600) {
        document.getElementsByClassName('footer')[0].style.display = "none";
        let MyURL = `/radius?lat=${map.getCenter().lat}&lng=${map.getCenter().lng}&radius=${Math.floor(mapRadius)}`
        fetch(MyURL, {headers: myHeaders})
        .then(response => response.json())
        .then(data => {
            for(var i = 0; i < data.length; i++) {
                var obj = data[i];
                var marker, test;
                test = obj.id;
                marker = L.marker([obj.lat, obj.lng], markerOptions).addTo(myFeatureGroup).bindPopup("");
                marker.test = test;
            }
        });
    } else {
        //The user is told to zoom in if the radius is more that 600
         document.getElementsByClassName('footer')[0].style.display = "block";
    }
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
    fetch(`/info?id=${event.layer.test}`, {headers: myHeaders})
    .then(response => response.json())
    .then(data => {
        console.log(data[0].id);
        document.getElementById('pic-title').innerHTML = data[0].title
        document.getElementById('info').innerHTML = data[0].info
        document.getElementsByClassName('view-photo')[0].style.display = "flex";
        document.getElementsByClassName('photo')[0].style.backgroundImage = `url('/img/${data[0].filename}')`;
    });
}

// This function closes the photo box.
function closePhoto() {
    // The photo box is hidded.
    document.getElementsByClassName('view-photo')[0].style.display = "none";
    // The top menubar is displayed to the user.
    document.getElementsByClassName('box')[0].style.display = "block";
}


// ****************************************
// ****************************************
// ****      Security Functions        ****
// ****************************************
// ****************************************

// Checking for a User's session 
if(sessionStorage.getItem('username') == null) {
    document.getElementsByClassName('login-box')[0].style.display = "block";
    document.getElementsByClassName('box')[0].style.display = "none";
    document.getElementsByClassName('footer')[0].style.display = "none";
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
    
}
// This function show the users the photos that they have marked at their favorite.
function myfavs() {
    
}

async function mysearch() {
    
}

function signup() {
    alert("Sign Up is not enabled at this time. This site is still a work in progress.")
}


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
    loadMarkers;
}

async function disableupload() {
    const formData = new FormData();
    formData.append("photo", files.files[0]);
    
    fetch("/upload", {
        method: 'post',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        document.getElementById('image').style.backgroundImage = `url(/img/${data.image})`
        document.getElementById("camera").value = data.camera
        document.getElementById("camera").setAttribute('value', data.camera);
        document.getElementById("iso").value = data.ISO
     });
}

function setMapMarker() { 
    document.getElementsByClassName('add-box')[0].style.display = "none";
    window.setTimeout (markerSet == true, 3)
}

async function LoadAddCat() {
    var select = document.getElementById("cat");
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