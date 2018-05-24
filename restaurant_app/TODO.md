# Restaurant Reviews: Stage 2

## PWA - Offline data, performance and accessability

### CRITERIA

1. Fork and clone the server repository. You’ll use this development server to develop your project code.
2. Change the data source for your restaurant requests to pull JSON from the server, parse the response and use the response to generate the site UI.
3. Cache the JSON responses for offline use by using the IndexedDB API.
4. Follow the recommendations provided by Lighthouse to achieve the required performance targets.
5. Submit your project code for review.

### MEETS SPECIFICATIONS

1. The client application should pull restaurant data from the development server, parse the JSON response, and use the information to render the appropriate sections of the application UI.

2. The client application works offline. JSON responses are cached using the IndexedDB API. Any data previously accessed while connected is reachable while offline.

3. The application maintains a responsive design on mobile, tablet and desktop viewports.

4. The application retains accessibility features from the Stage 1 project. Images have alternate text, the application uses appropriate focus management for navigation, and semantic elements and ARIA attributes are used correctly.

5. Lighthouse targets for each category exceed:

* Progressive Web App: >90
* Performance: >70
* Accessibility: >90

---

[Restaurant Reviews: Stage 2 - Rubric](https://review.udacity.com/#!/rubrics/1131/view)

---

### Initial Review

* ~~Provide undefined.jpg image for restaurants without a picture~~
* ~~Update dbHelper.fetchRestaurants to use fetch API not XHR~~
* ~~gulp task to process images to webp format and small, medium, large versions for the appropriate viewport~~
* ~~add IndexedDB to cache the json data~~
* ~~handle missing images (undefined.jpg)~~
* ~~add multi platform fave icons~~

* TARGET - Lighthouse Analysis - Progressive Web App: >90 / Performance: >70  / Accessibility: >90
* STAGE 1 - Lighthouse Analysis - Progressive Web App: 55 / Performance: 61  / Accessibility: 86

**Accessibility**
**Score : index.html (100)**

* ~~Improve Footer contrast ratios~~
* ~~Improve #restaurants-list li h2 contrast ratio~~
* ~~Improve #restaurants-list li a contrast ratio~~
* ~~Add html lang attributes~~
* ~~Improve #restaurant-name contrast ratio~~
* ~~Improve #reviews-list li .rating contrast ratio~~
* ~~Improve #reviews-list li .date contrast ratio~~
* ~~Improve #breadcrumb li a contrast ratio~~

**Performance**
**Score : 79**

* ~~updated google maps api url and saw 7 point increase!~~

* ~~meaningful first paint - no change~~
* ~~first interaction - no change~~
* ~~offscreen images~~ - IntersectObserver hasnt helped score

* ~~create gulp task to generate small, medium, large images~~
* ~~convert jpg images to webp~~
* ~~create gulp task to create webp images~~

* ~~create gulp task to minify css - no action~~
* ~~create gulp task to minify js - no action~~
* ~~create base.css style to @import url("base.css"); into media css - no action~~
* ~~Split css into viewport sizes - load css based on media queries - no action~~

**PWA**
**Score : 91**
* ~~create manifest - also needed site.webmanifest~~
* ~~no custom splash screen~~
* ~~address bar does not match brand colours~~
* ~~various size app icons~~
* ~~does not redirect to https - Deployment issue~~
* ~~page load not fast enough on 3G~~