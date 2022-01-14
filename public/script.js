// ****************************************
// ****************************************
// ****       Global Variables         ****
// ****************************************
// ****************************************


var zoomLock = false;                               //map lock for on.map drag and zoom functions
const buttonBox = document.getElementById('box')    //Menubar box
let uploadbox = document.getElementById("addfile")
let latlng = document.getElementById("latlng")
let title = document.getElementById("title")
let uploadfile = document.getElementById('files')



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
    L.control.zoom({
        position:'bottomright'
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
    if(localStorage.getItem('username') !== null){
        loadMarkers();
    }
});
// Prevents map from loading markers when there is not a logged in user.
map.on('zoomend', function(ev) {
    if(localStorage.getItem('username') !== null){
        loadMarkers();
        console.log(map.getZoom())
    }
});
// Logs where a user clicked on the map.
// map.on('click', function(ev) {
//     console.log("You clicked the map at Lat:" + ev.latlng.lat.toString() +" and Lng: " + ev.latlng.lng.toString());
// });

// Prevents map from being dragged when hovering over the top buttons
buttonBox.addEventListener('mouseover', () => {
    zoomLock = true
    map.on("zoomstart", function(e) {if(zoomLock){throw 'zoom disabled';}});
})
// Prevents map from being dragged when hovering over the top buttons
buttonBox.addEventListener('mouseleave', () => {
    zoomLock = false
    map.on("zoomstart", function(e) {if(zoomLock){throw 'zoom disabled';}});
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
        fetch(MyURL)
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
    fetch(`/info?id=${event.layer.test}`)
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
if(localStorage.getItem('username') == null) {
    document.getElementById("add").style.display = "none";
    document.getElementById("myphotos").style.display = "none";
    document.getElementById("myfavs").style.display = "none";
    document.getElementById("search").style.display = "none";
    zoomLock = false;
    document.getElementsByClassName('footer')[0].style.display = "none";
} else 
    loadMarkers();
    function openloginbox() {
    document.getElementsByClassName('login-box')[0].style.display = "block";
    document.getElementsByClassName('box')[0].style.display = "none";
}

function closeloginbox() {
    document.getElementsByClassName('login-box')[0].style.display = "none";
    document.getElementsByClassName('box')[0].style.display = "block";
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


async function test() {
const myHeaders = new Headers();

myHeaders.append('Content-Type', 'application/json');
myHeaders.append('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiamZleWVuIiwiaWF0IjoxNjQyMTA4ODMzfQ.-YJqEzskQKR2poFtJ7VUa-CI7NR13LxVfqzdWsWrBy4');

return fetch('/test', {
  method: 'POST',
  headers: myHeaders,
})
.then(response => response.text())
.then(data => {
    console.log(data);
});

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
     latlgnselected()
}

function latlgnselected() {
    uploadfile.disabled = true
    latlng.style.backgroundColor = "transparent"
    title.style.backgroundColor = "red"
}