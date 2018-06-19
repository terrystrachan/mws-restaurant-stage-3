/*global idb */
/*global L */
'use strict';

const DB_VERSION = 1;
const DB_NAME = 'mws-restaurant-stage-3';
const RESTAURANT_KEY_STORE = 'restaurants';
const FAVOURITE_SYNC_STORE = 'restaurants-sync';
const REVIEW_KEY_STORE = 'reviews';
const REVIEW_SYNC_STORE = 'reviews-sync';

var dbPromise = idb.open(DB_NAME, DB_VERSION, function (upgradeDb) {
  if (!upgradeDb.objectStoreNames.contains(RESTAURANT_KEY_STORE)) {
    upgradeDb.createObjectStore(RESTAURANT_KEY_STORE, { keyPath: 'id' });
  }
  if (!upgradeDb.objectStoreNames.contains(REVIEW_KEY_STORE)) {
    upgradeDb.createObjectStore(REVIEW_KEY_STORE, { keyPath: 'id' });

    let reviewStore = upgradeDb.transaction.objectStore(REVIEW_KEY_STORE);
    reviewStore.createIndex('restaurant_id', 'restaurant_id');
  }

  if (!upgradeDb.objectStoreNames.contains(FAVOURITE_SYNC_STORE)) {
    upgradeDb.createObjectStore(FAVOURITE_SYNC_STORE, { keyPath: 'id' });
  } else {
    console.info("sync already created - does it contain data to sync?")
  }

  if (!upgradeDb.objectStoreNames.contains(REVIEW_SYNC_STORE)) {
    upgradeDb.createObjectStore(REVIEW_SYNC_STORE, { keyPath: 'id' });
  } else {
    console.info("reviews sync already created - does it contain data to sync?")
  }

});

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    dbPromise.then(function (db) {
      if (!db) { return; }
      var tx = db.transaction([RESTAURANT_KEY_STORE], 'readonly');
      var store = tx.objectStore(RESTAURANT_KEY_STORE);
      return store.getAll().then(restaurantList => {
        if (restaurantList.length == 0) {
          //split into functions
          fetch(DBHelper.DATABASE_URL + "/restaurants")
            .then(response => {
              return response.json();
            })
            .then(restaurants => {

              const tx = db.transaction(RESTAURANT_KEY_STORE, 'readwrite');
              const store = tx.objectStore(RESTAURANT_KEY_STORE);
              restaurants.forEach(restaurant => {
                store.put(restaurant);
              });
              console.log("from the network - STORED!!!!");
              callback(null, restaurants);
            })
            .catch(error => {
              callback(error, null);
            });
        } else {
          console.log("from the database!!!!");
          callback(null, restaurantList);
        }
      });

    });
  }

  static fetchReviewsByRestaurant(restaurantId, callback) {
    dbPromise.then(function (db) {
      if (!db) { return; }
      var tx = db.transaction([REVIEW_KEY_STORE], 'readonly');
      var store = tx.objectStore(REVIEW_KEY_STORE);
      var byRestaurant = store.index('restaurant_id');
      return byRestaurant.getAll(restaurantId).then(reviewsList => {
        if (reviewsList.length == 0) {
          //split into functions
          fetch(DBHelper.DATABASE_URL + "/reviews/?restaurant_id=" + restaurantId)
            .then(response => {
              return response.json();
            })
            .then(reviews => {

              const tx = db.transaction(REVIEW_KEY_STORE, 'readwrite');
              const store = tx.objectStore(REVIEW_KEY_STORE);
              reviews.forEach(review => {
                store.put(review);
              });
              console.log("from the network - STORED!!!!");
              callback(null, reviews);
            })
            .catch(error => {
              callback(error, null);
            });
        } else {
          console.log("from the database!!!!");
          callback(null, reviewsList);
        }
      });

    });
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });

  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    var marker = L.marker(restaurant.latlng,
      {
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map
      }
    );
    return marker;
  }

  /**
   * update restaurant favourite true / false
   * @param {*} restaurant 
   */
  static toggleFavorite(restaurant) {
    this.storeLocalData(RESTAURANT_KEY_STORE, restaurant);
    this.postFavourite(restaurant.id, restaurant.is_favorite);
  }

  /**
   * 
   * @param {*} keyStore 
   * @param {*} data 
   */
  static storeLocalData(keyStore, data) {
    dbPromise.then(db => {
      if (!db) { return; }
      const tx = db.transaction(keyStore, 'readwrite');
      const store = tx.objectStore(keyStore);
      store.put(data);
    });
  }


  /**
   * Put favourite update to backend
   * Store locally if backend not available
   * @param {*} id 
   * @param {*} isFavourite 
   */
  static postFavourite(id, isFavourite) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ "is_favorite": isFavourite }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        return response.json();
      }
      ).catch(error => {
        console.error("Saving favourite failed ", error);
        dbPromise.then(db => {
          if (!db) { return; }
          const tx = db.transaction(FAVOURITE_SYNC_STORE, 'readwrite');
          const store = tx.objectStore(FAVOURITE_SYNC_STORE);
          store.put({ "id": id, "is_favorite": isFavourite });
        });
      });
  }

  /**
   * Now you're back online
   * sync offline favourites and reviews
   */
  static syncOfflineUpdates() {
    this.syncFavouriteActions();
    this.syncReviews();
  }

  /**
   * Now you're back online
   * Post the favourite updates to the backend
   * and then clear the sync store
   */
  static syncFavouriteActions() {
    console.log("Now you're back online - time to sync")
    dbPromise.then(function (db) {
      if (!db) { return; }
      var tx = db.transaction([FAVOURITE_SYNC_STORE], 'readwrite');
      var store = tx.objectStore(FAVOURITE_SYNC_STORE);
      return store.getAll().then(syncList => {
        if (syncList.length > 0) {
          syncList.forEach(syncRecord => {
            console.log("posting", syncRecord);
            DBHelper.postFavourite(syncRecord.id, syncRecord.is_favorite);
          });
          DBHelper.clearSyncStore(FAVOURITE_SYNC_STORE);
        }
      });
    });
  }

  /**
   * Now you're back online
   * Post the reviews to the backend
   * and then clear the sync store
   */
  static syncReviews() {
    dbPromise.then(function (db) {
      if (!db) { return; }
      var tx = db.transaction([REVIEW_SYNC_STORE], 'readwrite');
      var store = tx.objectStore(REVIEW_SYNC_STORE);
      return store.getAll().then(syncList => {
        if (syncList.length > 0) {
          syncList.forEach(syncRecord => {
            console.log("posting", syncRecord);
            DBHelper.postReview(syncRecord);
          });
          DBHelper.clearSyncStore(REVIEW_SYNC_STORE);
        }
      });
    });
  }

  /**
   * Clear sync table
   * @param {*} syncStoreName 
   */
  static clearSyncStore(syncStoreName) {
    return dbPromise.then(db => {
      const tx = db
        .transaction(syncStoreName, 'readwrite')
        .objectStore(syncStoreName)
        .clear();
      return tx.complete;
    });
  }

  /**
   * Add a new Review to the database
   * and post to the backend
   * @param {*} review 
   */
  static addReview(review) {
    this.storeLocalData(REVIEW_KEY_STORE, review);
    this.postReview(review);
  }

  /**
   * Put review to backend
   * Store locally if backend not available
   * @param {*} review 
   */
  static postReview(review) {
    fetch(DBHelper.DATABASE_URL + "/reviews/", {
      method: 'POST',
      body: JSON.stringify(
        {
          "restaurant_id": review.restaurant_id,
          "name": review.name,
          "rating": review.rating,
          "comments": review.comments
        }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        return response.json();
      }
      ).catch(error => {
        console.error("Saving review failed ", error);
        dbPromise.then(db => {
          if (!db) { return; }
          const tx = db.transaction(REVIEW_SYNC_STORE, 'readwrite');
          const store = tx.objectStore(REVIEW_SYNC_STORE);
          store.put({ "id": review.id, "review": review });
        });
      });
  }

}