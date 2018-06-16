/*global L */
/*global DBHelper */
/*global IntersectionObserver*/

'use strict';
let restaurants;
let neighborhoods;
let cuisines;
var map;
var markers = [];
var markersLayer;
let observer;
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  markersLayer = new L.LayerGroup();
  window.self.map = L.map('map').setView([40.722216, -73.987501], 12);

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 12,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoidGVycnlzdHJhY2hhbiIsImEiOiJjamhraGJyamcxZXNzMzhvN21tdWhkbGUxIn0.Ja6aFzeyAoTOJouHiB8OYA'
  }).addTo(window.self.map);
  markersLayer.addTo(map);


  updateRestaurants();
  document.getElementById('map-container').style.display = 'block';
  populateDb().then(() => {
    fetchNeighborhoods();
    fetchCuisines();
  }).catch((error) => {
    console.error(error);
  });

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  });

function updateOnlineStatus() {
  var status = document.getElementById("onlineStatus");
 
  var condition = navigator.onLine ? "online" : "offline";

  status.className = condition;
  status.innerHTML = condition.toUpperCase();
  
  DBHelper.syncFavouriteActions();
  
  }

function populateDb() {

  return new Promise((resolve, reject) => {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) { // Got an error
        console.error(error);
        reject(error);
      } else {
        resolve(restaurants);
      }
    });
  }
  );
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
function fetchNeighborhoods() {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      window.self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
function fillNeighborhoodsHTML(neighborhoods = window.self.neighborhoods) {
  const select = document.getElementById('neighborhoods-select');
  let cntr = 1;
  let maxNeighborhoods = neighborhoods.length;

  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('aria-setsize', maxNeighborhoods);
    option.setAttribute('aria-posinset', cntr);
    select.append(option);
    cntr += 1;
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
function fetchCuisines() {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      window.self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
function fillCuisinesHTML(cuisines = window.self.cuisines) {
  const select = document.getElementById('cuisines-select');
  let cntr = 1;
  let maxCuisines = cuisines.length;
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('aria-setsize', maxCuisines);
    option.setAttribute('aria-posinset', cntr);
    select.append(option);
    cntr += 1;
  });
}

// /**
//  * Initialize Google map, called from HTML.
//  */
// window.initMap = () => {
//   // let loc = {
//   //   lat: 40.722216,
//   //   lng: -73.987501
//   // };
//   // self.map = new google.maps.Map(document.getElementById('map'), {
//   //   zoom: 12,
//   //   center: loc,
//   //   scrollwheel: false
//   // });

//   self.map = L.map('map').setView([40.722216, -73.987501], 12);
//   updateRestaurants();
//   document.getElementById('map-container').style.display = 'block';
// }

/**
 * Update page and map for current restaurants.
 */
function updateRestaurants() {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
function resetRestaurants(restaurants) {
  // Remove all restaurants
  window.self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  window.self.markers.forEach(m => m.setMap(null));
  window.self.markers = [];
  window.self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
function fillRestaurantsHTML(restaurants = window.self.restaurants) {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  preloadImageObserver();
}

function preloadImageObserver() {

  const images = document.querySelectorAll('.restaurant-img');
  const config = {
    rootMargin: '50px 0px',
    threshold: 0.01
  };

  if (!('IntersectionObserver' in window)) {
    Array.from(images).forEach(image => preloadImage(image));
  } else {
    observer = new IntersectionObserver(onIntersection, config);
    images.forEach(image => {
      observer.observe(image);
    });
  }
}

function onIntersection(entries) {
  entries.forEach(entry => {
    if (entry.intersectionRatio > 0) {
      // Stop watching and load the image
      observer.unobserve(entry.target);
      preloadImage(entry);
    }
  });
}

function preloadImage(entry) {
  entry.target.src = entry.target.dataset.src;
  entry.target.srcset = entry.target.dataset.srcset;
}

/**
 * Create restaurant HTML.
 */
function createRestaurantHTML(restaurant) {
  const star = document.createElement('span');
  star.className = "favorite-star";
  star.innerHTML = "&#x2605;";
  console.log("is fave = ", restaurant.is_favorite);
  if (restaurant.is_favorite) {
    console.log("restaurant = " + restaurant.name + " ("+ restaurant.id+") " + restaurant.is_favorite);
    star.className += " favorite";
  }

  star.addEventListener('click', e => {
    console.log(e);
    if (restaurant.is_favorite) {
      e.target.className = "favorite-star";
    } else {
      e.target.className = "favorite-star favorite";
    }
    restaurant.is_favorite = !restaurant.is_favorite;
    DBHelper.toggleFavorite(restaurant);

  });

  let li = document.createElement('li');

  const imageFilename = DBHelper.imageUrlForRestaurant(restaurant);
  let image = document.createElement('img');

  image.className = 'restaurant-img';
  image.setAttribute('data-src', imageFilename + '-l.webp');
  image.setAttribute('data-srcset', imageFilename + '-s.webp' + ' 600w');
  //image.src = imageFilename + '-l.webp';
  //  image.srcset = imageFilename + '-s.webp' + ' 600w';
  image.alt = 'Photograph from the ' + restaurant.name + ' restaurant';
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', 'View ' + restaurant.name + ' details');
  more.setAttribute('role', 'button');
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);
  li.append(star);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
function addMarkersToMap(restaurants = window.self.restaurants) {
  markersLayer.clearLayers();

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, window.self.map);

    marker.bindPopup(marker.options.title);
    marker.on('mouseover', function (e) {
      e.target.openPopup();
    });
    marker.on('mouseout', function (e) {
      e.target.closePopup();
    });

    markersLayer.addLayer(marker);
    marker.on('click', () => {
      window.location.href = marker.options.url;
    });
  });
}