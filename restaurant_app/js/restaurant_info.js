/* global DBHelper */
/* global L */

'use strict';
let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  if (event.error) { // Got an error!
    console.error(event.error);
  } else {
    loadRestaurant();
    addReviewButtonListener();
    addReviewModalEvents();
    addConnectivityListeners();
  }
});

/**
 * load the restaurants and initialise the map
 */
function loadRestaurant() {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
      return false;
    } else {
      initMap();
      fillBreadcrumb();
      document.getElementById("review-header").innerHTML = "Please review " + restaurant.name;
    }
  });
}

/**
 * display the review modal
 */
function addReviewButtonListener() {
  document.getElementById('addReview').addEventListener('click', toggleModal);
}
/**
 * 
 */
function initMap() {
  window.self.map = L.map('map').setView([40.722216, -73.987501], 12);

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 12,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoidGVycnlzdHJhY2hhbiIsImEiOiJjamhraGJyamcxZXNzMzhvN21tdWhkbGUxIn0.Ja6aFzeyAoTOJouHiB8OYA'
  }).addTo(window.self.map);
  const marker = DBHelper.mapMarkerForRestaurant(window.self.restaurant, window.self.map);

  marker.bindPopup(marker.options.title);
  marker.on('mouseover', function (e) {
    e.target.openPopup();
  });
  marker.on('mouseout', function (e) {
    e.target.closePopup();
  });

  marker.addTo(map);
  marker.on('click', () => {
    window.location.href = marker.options.urll;
  });

}

/**
 * add click events to modal 
 */
function addReviewModalEvents() {
  const closeButton = document.querySelector(".close-button");
  const saveButton = document.querySelector("#saveReview");

  window.addEventListener("click", closeModal);
  closeButton.addEventListener("click", toggleModal);
  saveButton.addEventListener("click", addReview);
}

/**
 * Trigger when page goes on / off line
 */
function addConnectivityListeners() {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

/**
 * visual indicator of Offline status
 * and trigger synchronisation of offline data
 */
function updateOnlineStatus() {
  let status = document.getElementById("onlineStatus");
  const condition = navigator.onLine ? "online" : "offline";
  status.className = condition;
  status.innerHTML = condition.toUpperCase();

  DBHelper.syncOfflineUpdates();
}

/**
 * Get current restaurant from page URL.
 */
function fetchRestaurantFromURL(callback) {
  if (window.self.restaurant) { // restaurant already fetched!
    callback(null, window.self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    let error = new Error('No restaurant id in URL');
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      window.self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
function fillRestaurantHTML(restaurant = window.self.restaurant) {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const star = document.getElementById('restaurant-star');
  if (restaurant.is_favorite) {
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

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + '-m.webp';
  image.alt = 'Photograph from the ' + restaurant.name + ' restaurant';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  updateRestaurantReviews();
}

function updateRestaurantReviews() {
  // fill reviews

  window.self.restaurant.reviews = [];
  const reviewsContainer = document.getElementById('reviews-list');
  reviewsContainer.innerHTML = '';

  DBHelper.fetchReviewsByRestaurant(window.self.restaurant.id, (error, reviewsList) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillReviewsHTML(reviewsList);
    }
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
function fillRestaurantHoursHTML(operatingHours = window.self.restaurant.operating_hours) {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    if (operatingHours.hasOwnProperty(key)) {
      const row = document.createElement('tr');

      const day = document.createElement('td');
      day.innerHTML = key;
      row.appendChild(day);

      const time = document.createElement('td');
      time.innerHTML = operatingHours[key];
      row.appendChild(time);

      hours.appendChild(row);
    }
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
function fillReviewsHTML(reviews = window.self.restaurant.reviews) {
  const container = document.getElementById('reviews-container');
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
function createReviewHTML(review) {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute('tabindex', 0);
  name.className = 'header';
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt).toLocaleString();;
  date.className = 'date';
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'rating';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
function fillBreadcrumb(restaurant = window.self.restaurant) {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL
 * @param {*} name 
 * @param {*} url 
 */
function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Add a new review
 * @param {*} event 
 */
function addReview(event) {
  event.preventDefault();

  const reviewer = document.getElementById('reviewerName').value;
  const reviewText = document.getElementById('reviewerComments').value;
  if (reviewer == "" || reviewText == "") {
    alert("All fields must be completed");
    return false;
  }

  const rating = parseInt(
    document.querySelector('input[name="starRating"]:checked').value
  );

  DBHelper.addReview(
    {
      id: Date.now(), // temporary id
      restaurant_id: window.self.restaurant.id,
      name: reviewer,
      rating: rating,
      comments: reviewText,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

  updateRestaurantReviews();
  clearForm();
  toggleModal();
}

/**
 * Clear the review form fields
 */
function clearForm() {
  document.getElementById('reviewerName').value = "";
  document.getElementById('reviewerComments').value = "";
  document.querySelector('input[id="rating1"]').checked = true;
}

/**
 * show / hide review popup modal
 */
function toggleModal() {
  const modal = document.querySelector(".modal");
  modal.classList.toggle("show-modal");
}

/**
 * Close Review popup modal 
 * @param {*} event 
 */
function closeModal(event) {
  if (event.target === document.querySelector(".modal")) {
    toggleModal();
  }
}