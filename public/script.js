// ****************************************
// ****************************************
// ****       Global Variables         ****
// ****************************************
// ****************************************
//import exifr from './node_modules/exifr/dist/lite.esm.js'
// 
// const { i } = require("mathjs");

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-WB4ZCCLGB3');

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
let comment_text = document.getElementById("commenttext");
let toplistBox = document.getElementById('toplist')

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
    
    if (event.code == 'ArrowRight' && comment_text.focus == false) {
        nextpic()
    } 


    if (event.code == 'ArrowLeft' && comment_text.focus == false) {
        lastpic()
    } 

      if (event.code == 'Escape') {
        // Handle the event with KeyboardEvent.key
        closePhoto();
      } 

      if (event.code == 'Enter') {
        commentPost()
    } 
    

  });







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
        //console.log(map.getZoom())
    }
});
// Logs where a user clicked on the map.
map.on('click', function(ev) {
    const mapLat = ev.latlng.lat.toString()
    const mapLng = ev.latlng.lng.toString()
    addPic.lat = mapLat
    addPic.lng = mapLng
    //console.log('Map clicked: ' + mapLat + ' : ' +  mapLng)
    if(setLocation == true && document.getElementsByClassName('add-box')[0].style.display == "none") {
        myFeatureGroup.clearLayers();
        L.marker([mapLat, mapLng], markerOptions).addTo(myFeatureGroup).bindPopup("")
        //console.log('Location Selected: ' + addPic.lat + ' - ' + addPic.lng)
    }
});

map.on('dblclick', function(ev) {
    preventDefault()
})

map.on('keydown', function(ev) {
    ev.map.zoomLock = true
    
    //console.log("Key")
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
        map.dragging.enable()
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
     fetch(`/info?id=${event.layer.test}`, {headers: myHeaders})
     .then(response => response.json())
     .then(data => {
         //console.log(data[0].id);
         document.getElementById('pic-title').innerHTML = data[0].title
         document.getElementById('info').innerHTML = data[0].info
         document.getElementsByClassName('view-photo')[0].style.display = "flex";
         document.getElementsByClassName('photo')[0].style.backgroundImage = `url('/img/${data[0].filename}')`;
         
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

    fetch(`/comments?id=${event.layer.test}`)
    .then(response => response.json())
    .then(data => {
        //console.log(data)
        document.getElementById('comment-box').innerHTML = ''
        
        if(data.length > 0) {
            document.getElementById('comment-count').innerHTML = data.length
            for(let i = 0; i < data.length; i++) {
                let userPic
                let url = `/img/profile/${data[i].user}.jpg`
                var http = new XMLHttpRequest(); 
          
                
                if (url.length === 0) { 
                    output.innerHTML = "Please enter File URL"; 
                } else { 
                    http.open('HEAD', url, false); 
                    http.send(); 
                    if (http.status === 200) { 
                        console.log("File exists"); 
                        userPic = `/img/profile/${data[i].user}.jpg`
                    } else { 
                        console.log("File doesn't exists"); 
                        userPic = `/img/profile/default.png`
                    } 
                } 
            

                document.getElementById('comment-box').innerHTML += `
                                    <div class="user-comments">

                                        <div class="comment-box">
                                            <div class="comment-layout">
                                                <div>
                                                <img class="comment-pic" src="${userPic}"></img> 
                                                <center><span class="comment-name" id="comment-name">${data[i].user}</span></center>
                                                </div>
                                                <p class="comment-text">${data[i].comment}</p>
                                                
                                            </div>  
                                            <center> <button class="comment-like-btn" id="comment${data[i].id}" onclick="commentLike(${data[i].id});"><i class="fa fa-thumbs-o-up comment-thumb" aria-hidden="true"></i>  Like (<span id="likecount${data[i].id}">${data[i].likes}</span>)</button> </center>
                                        </div>
                                    </div>
                `
            }
        } else {
            document.getElementById('comment-count').innerHTML = data.length
        }
    });


    L.DomEvent.disableScrollPropagation(document.getElementById('view-photo'))
    map.dragging.disable()
    picid =  event.layer.test
    //console.log('Done')


    
}

function getComments() {
    fetch(`/comments?id=${picid}`)
    .then(response => response.json())
    .then(data => {
        //console.log(data)
        document.getElementById('comment-box').innerHTML = ''
        
        if(data.length > 0) {
            document.getElementById('comment-count').innerHTML = data.length
            for(let i = 0; i < data.length; i++) {
                let userPic
                let url = `/img/profile/${data[i].user}.jpg`
                var http = new XMLHttpRequest(); 
          
                
                if (url.length === 0) { 
                    output.innerHTML = "Please enter File URL"; 
                } else { 
                    http.open('HEAD', url, false); 
                    http.send(); 
                    if (http.status === 200) { 
                        console.log("File exists"); 
                        userPic = `/img/profile/${data[i].user}.jpg`
                    } else { 
                        console.log("File doesn't exists"); 
                        userPic = `/img/profile/default.png`
                    } 
                } 
                document.getElementById('comment-box').innerHTML += `
                                    <div class="user-comments">

                                        <div class="comment-box">
                                            <div class="comment-layout">
                                                <div>
                                                <img class="comment-pic" src="${userPic}"></img> 
                                                <center><span class="comment-name" id="comment-name">${data[i].user}</span></center>
                                                </div>
                                                <p class="comment-text">${data[i].comment}</p>
                                                
                                            </div>  
                                            <center> <button class="comment-like-btn" id="comment${data[i].id}" onclick="commentLike(${data[i].id});"><i class="fa fa-thumbs-o-up comment-thumb" aria-hidden="true"></i>  Like (<span id="likecount${data[i].id}">${data[i].likes}</span>)</button> </center>
                                        </div>
                                    </div>
                `
            }
        } else {
            document.getElementById('comment-count').innerHTML = data.length
        }
    });
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
    map.dragging.enable()
    fetch(`/myview?user=${sessionStorage.getItem('username')}`)
    .then(response => response.json())
    .then(data => {
        //console.log(data)
        map.panTo(new L.LatLng(data[0].lat, data[0].lng));
        map.setZoom(data[0].zoom)
            //map = L.map('map').setView([data[0].lat, data[0].lng], data[0].zoom, draggable = false);
            map.dragging.enable()
        });  

}else if(sessionStorage.getItem('username') == null && sessionStorage.getItem('token') == null){
    document.getElementsByClassName('login-box')[0].style.display = "block";
    document.getElementsByClassName('box')[0].style.display = "none";
    document.getElementsByClassName('footer')[0].style.display = "none";
    document.getElementById('login_box').focus()
    map.dragging.disable()
    L.DomEvent.disableScrollPropagation(document.getElementById('login_box'))

} else {
    loadMarkers();
    document.getElementsByClassName('login-box')[0].style.display = "none";
    document.getElementsByClassName('box')[0].style.display = "block";
    map.dragging.enable()
    fetch(`/myview?user=${sessionStorage.getItem('username')}`)
    .then(response => response.json())
    .then(data => {
        //console.log(data)
        map.panTo(new L.LatLng(data[0].lat, data[0].lng));
        map.setZoom(data[0].zoom)
            //map = L.map('map').setView([data[0].lat, data[0].lng], data[0].zoom, draggable = false);
        });  
}

// ****************************************
// ****************************************
// ****      Comments Functions        ****
// ****************************************
// ****************************************

function commentLike(id) {
    let Likebtn = document.getElementById(`comment${id}`)
    let Likebtncount = document.getElementById(`likecount${id}`).innerHTML   

    fetch(`likecomments?id=${id}`, {
        method: 'post'
    })
    .then(response => response.json())
    .then(data => {
        if(data.changedRows = 1) {
            Likebtncount = parseInt(Likebtncount) + 1
            Likebtn.style.display = "none"
            //Likebtn.disable = true
        }
     });
}

function commentPost() {
    
    let commentdata = {
        photo_id: picid,
        comment: comment_text.value,
        user: sessionStorage.getItem('username')
    }

    fetch("/comments", {
        method: 'POST',
        body: JSON.stringify(commentdata),
        headers: myHeaders
    })
    .then(response => response.json())
    .then(data => {
        if(data.affectedRow = 1) {
            getComments()
        }
        
     });



    // fetch(`likecomments?id=${id}`, {
    //     method: 'post'
    // })
    // .then(response => response.json())
    // .then(data => {
    //     if(data.changedRows = 1) {
    //         Likebtncount = parseInt(Likebtncount) + 1
    //         Likebtn.style.display = "none"
    //     }
    //  });

    comment_text.value = ''
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

    fetch("/guest", {
        method: 'POST',
    })
    .then(response => response.text())
    .then(data => {

     });
    loadMarkers();
    sessionStorage.setItem('username', 'guest')
}

function closeSearh() {
    sbox.classList.remove("active")
}

function logout() {
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("token");
    window.location.reload();
}


function toplist() {
    activeSearch = true
    document.getElementsByClassName('footer')[0].style.display = "block";
    document.getElementById('footer-text').style.display = "none"
    document.getElementById('footer-btn').style.display = "none"
    document.getElementById('footer-btn-search').style.display = "block"
    document.getElementById('toplist').style.display = "block"
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
    document.getElementById('like-btn').classList.remove('btn-like')
    document.getElementById('favorite-btn').classList.remove('btn-favorite')
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
   document.getElementById('like-btn').classList.remove('btn-like')
    document.getElementById('favorite-btn').classList.remove('btn-favorite')
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
        map.dragging.enable()
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
        map.dragging.enable()
        picid = ""
    }
}

function disableSearch() {
    activeSearch = false
    document.getElementsByClassName('footer')[0].style.display = "none";
    document.getElementById('footer-text').style.display = "none"
    document.getElementById('footer-btn').style.display = "none"
    document.getElementById('footer-btn-search').style.display = "none"
    document.getElementById('toplist').style.display = "none"
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
    //console.log(frac.toString());

}

function signup() {
    alert("Sign Up is not enabled at this time. This site is still a work in progress.")
}

function like() {
    //like?picid=43&user=jfeyen
    let likecount = Number(document.getElementById('likes').innerHTML)
    
    fetch(`/like?picid=${picid}&userid=${sessionStorage.getItem('username')}`, {headers: myHeaders})
    .then(response => response.text())
    .then(data => {
        
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

function aboutopen() {
    document.getElementsByClassName('about-box')[0].style.display = "flex";
    document.getElementsByClassName('box')[0].style.display = "none";
    map.dragging.disable()
    L.DomEvent.disableScrollPropagation(document.getElementById('login_box'))
    
}

function aboutclose() {
    document.getElementsByClassName('about-box')[0].style.display = "none";
    document.getElementsByClassName('box')[0].style.display = "block";
    map.dragging.enable();
}


toplistBox.addEventListener('change', function() {
    map.setZoom(4);
    clearMap()
    fetch(`/${toplistBox.value}`)
    .then(response => response.json())
    .then(data => {
        console.log(data)

        for(var i = 0; i < data.length; i++) {
            var obj = data[i];
            var marker, test;
            test = obj.id;
            marker = L.marker([obj.lat, obj.lng], markerOptions).addTo(myFeatureGroup).bindPopup("");
            marker.test = test;
            loaded_id.push(obj.id)
        }
    });
})

    
//document.getElementById('picid').innerHTML = event.layer.test

// ****************************************
// ****************************************
// ****    Adding a photo functions    ****
// ****************************************
// ****************************************


function addphotosopen() {
    document.getElementsByClassName('add-box')[0].style.display = "block";
    document.getElementsByClassName('box')[0].style.display = "none";
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
        // console.log(data)
        sessionStorage.setItem("AddPic", data.image)
        document.getElementById('cameratext').value = data.camera;
        document.getElementById('lenstext').value = data.lens;
        document.getElementById('isotext').value = data.iso;
        document.getElementById('shuttertext').value = data.shutter
        document.getElementById('fstoptext').value = data.aperture
        document.getElementById('image').style.backgroundImage = `url(/img/${data.image})`
        document.getElementById('lat').innerText = data.gps.lat;
        document.getElementById('lng').innerText = data.gps.lng;
        
        map.panTo(new L.LatLng(data.gps.lat, data.gps.lng));
        map.setZoom(11)
        myFeatureGroup.clearLayers();
        L.marker([data.gps.lat, data.gps.lng], markerOptions).addTo(myFeatureGroup).bindPopup("")


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
          //console.log(data);
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

    //console.log(data)

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
 