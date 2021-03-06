var fs = require('fs');
var _ = require('lodash');
var moment = require('moment');
var rn = require('random-number');
var gen = rn.generator({min: -0.1, max: 0.1 });
var moment = require('moment');
var uuid = require('uuid');

module.exports = function($scope, $q, $modal, $templateCache, disasterService, DisasterTweets) {

  $scope.loading = false;
  $scope.query = "";

  $scope.disasters = [
    {"type": "hurricane", "selected": true, "users": ["twc_hurricane","NHC_Atlantic","NHC_Pacific","NHC_Surge"]},
    {"type": "volcano", "selected": true, "users": []},
    {"type": "wild fire", "selected": true, "users": ["wildfiretoday","pnw2","BCGovFireInfo","wildlandfirecom"]},
    {"type": "cold wave", "selected": true, "users": []},
    {"type": "flood", "selected": true, "users": ["FloodAlerts"]},
    {"type": "earthquake", "selected": true, "users": ["USGSBigQuakes","USGSEarthquakes","USGSted","EQTW","NewEarthquake"]},
    {"type": "severe storm", "selected": true, "users": []},
    {"type": "tornado", "selected": true, "users": ["NWStornado","TWCBreaking","WarnTornado"]},
    {"type": "tsunami", "selected": true, "users": ["Pacific","NWS_NTWC","NWS_PTWC","tsunamiwatch","EQTW","NewEarthquake"]},
    {"type": "generic disaster", "selected": true, "users": ["Disaster_Center","GEOcrisis"]}
  ];

  $scope.hashtags = ["melawanasap","indonesiafires"];

  // $scope.users = {
  //   weather_users: ["wunderground","weatherchannel","NWS"],
  //   location_users: ["LAFD",
  //     "dunedinflood","kawarauflood","upperclutha","lowerclutha","taierifloodinfo","northotagoflood","ORCFloodInfo",
  //     "NWSCharlestonSC"]
  // };

  $scope.data = {
    events: [],
    tweets: []
  };

  $scope.map = {center: {latitude: 40.1451, longitude: -99.6680 }, zoom: 3 };

  function getIcon(type) {
    if (type.code === 'TC' || type.code === 'hurricane') {
      return 'http://icons.iconarchive.com/icons/custom-icon-design/lovely-weather-2/32/Hurricane-icon.png';
    } else if (type.code === 'VO' || type.code === 'volcano') {
      return 'http://orig13.deviantart.net/5cea/f/2010/206/9/9/free_volcano_icon_by_mikoroh.gif';
    } else if (type.code === 'WF' || type.code === 'wild fire' || type.code === 'FR') {
      return 'http://i572.photobucket.com/albums/ss164/sofidius/inside%20the%20fire/50px-Fire-icon-1.png';
    } else if (type.code === 'CW' || type.code === 'cold wave') {
      return 'http://icons.iconarchive.com/icons/icons8/christmas-flat-color/24/snowflake-icon.png';
    } else if (type.code === ('FL' || 'FF') || type.code === 'flood') {
      return 'http://icons.iconarchive.com/icons/icons8/ios7/24/Weather-Floods-icon.png';
    } else if (type.code === 'EQ' || type.code === 'earthquake') {
      return 'http://icons.iconarchive.com/icons/icons8/ios7/24/Weather-Earthquakes-icon.png';
    } else if (type.code === 'ST' || type.code === 'severe storm') {
      return 'http://icons.iconarchive.com/icons/icons8/windows-8/24/Weather-Storm-icon.png';
    } else if (type.code === 'tornado') {
      return "http://icons.iconarchive.com/icons/icons8/windows-8/24/Weather-Tornado-icon.png";
    } else if(type.code === 'EP') {
      return 'http://icons.iconarchive.com/icons/icons8/windows-8/24/Industry-Biohazard-icon.png';
    } else if (type.code === "JRS") {
      return "http://i.imgur.com/w8Cv2A8.png";
    } else {
      return 'http://icons.iconarchive.com/icons/custom-icon-design/flatastic-9/24/Warning-icon.png';
    }
  }

  function getType(type) {
    if (type.code === 'TC') {
      return 'hurricane';
    } else if (type.code === 'VO') {
      return 'volcano';
    } else if (type.code === ('WF' || 'FR')) {
      return 'wild fire';
    } else if (type.code === 'CW') {
      return 'cold wave';
    } else if (type.code === ('FL' || 'FF')) {
      return 'flood';
    } else if (type.code === 'EQ') {
      return "earthquake";
    } else if (type.code === 'ST') {
      return 'severe storm';
    } else if (type.code === 'DR') {
      return 'drought';
    } else if (type.code === 'EP') {
      return 'epidemic';
    } else if (type.code === 'HT') {
      return 'heat wave';
    } else if (type.code === 'IN') {
      return 'insects';
    } else if (type.code === 'LS') {
      return 'landslide';
    } else if (type.code === 'AV') {
      return 'avalanche';
    } else if (type.code === 'SS') {
      return 'storm surge';
    } else if (type.code === 'AC') {
      return 'technological';
    } else if (type.code === 'TS') {
      return 'tsunami';
    } else if (type.code === "JRS") {
      return 'Tech Needed!';
    } else {
      return 'generic disaster';
    }
  }

   // earthquake
   // http://icons.iconarchive.com/icons/icons8/ios7/24/Weather-Earthquakes-icon.png

   // fire
   // http://i572.photobucket.com/albums/ss164/sofidius/inside%20the%20fire/50px-Fire-icon-1.png

   // flood
   // http://icons.iconarchive.com/icons/icons8/ios7/24/Weather-Floods-icon.png

   // tornado
   // http://icons.iconarchive.com/icons/icons8/windows-8/24/Weather-Tornado-icon.png

  $scope.clickMarker = function(marker) {
    $modal.open({
      controller: require('./markerModal.controller.js'),
      template: $templateCache.get('markerModal_view.html'),
      size: 'lg',
      resolve: {
        disaster: function () {
          return marker;
        }
      }
    });
  };

  $scope.getData = function (query) {
    if (query === null || angular.isUndefined(query)) { query=""; } else { query += " "; }

    $scope.data.events = [];
    $scope.data.tweets = [];
    $scope.loading = true;
    var dataFetchers = [];

    _.each($scope.disasters, function (d) {
      if (d.selected === true && !angular.equals(d.users,[])) {
        dataFetchers.push($scope.fetchDisasterTweets(query, d.users, d.type));
      }
    });
    dataFetchers.push($scope.fetchCrimeTweets('crime'));
    dataFetchers.push($scope.fetchDisasters());

    $q.all(dataFetchers).then( function () {
      $scope.data.tweets = _.sortBy($scope.data.tweets, 'created_at').reverse();
      $scope.data.events.push({
        id: uuid.v4(),
        'coords': {
          "latitude": 32.842179,
          "longitude": -79.868966
        },
        options: {
          dragable: false,
          icon: {
            url: getIcon({ code: "JRS" })
          }
        },
        data:  {
          name: "Jack Russell Software, the best workplace on Earth",
          type: "JRS",
          description: 'Apply Now to work in the greatest city EVER!! No disasters!! http://www.carekinesis.com/careers/',
          location: 'Charleston, SC, USA',
          date: moment().format('MMM D, YYYY h:mm a')
        }
      });
      $scope.loading = false;
    }, function () {
      $scope.loading = false;
    });
  };

  $scope.fetchDisasterTweets = function (query, users, type) {
    return DisasterTweets.fetchTweets(query, users).
      then(function (response) {
        var tempTweets = [];
        _.each(response.data.statuses, function (res) {
          var tweet = _.pick(res,'created_at','text','user','geo','coordinates','place','entities');

          tweet.created_at = moment(res.created_at).format('MMM D, YYYY h:mm a');
          if (tweet.entities.hashtags.length > 0) { tweet.entities.hashtags = _.uniq(res.entities.hashtags, 'text'); }
          tweet.type = type;

          tempTweets.push(tweet);
          $scope.data.tweets.push(tweet);
        });

        var events = _.map(tempTweets, function (res) {
          if(res.coordinates) {
            return {
              id: uuid.v4(),
              'coords': {
                "latitude": parseInt(res.coordinates.coordinates[1], 10) + gen(),
                "longitude": parseInt(res.coordinates.coordinates[0], 10) + gen()
              },
              options: {
                dragable: false,
                icon: {
                  url: getIcon({ code: type })
                }
              },
              data:  {
                name: angular.isDefined(res.entities) && angular.isDefined(res.entities.hashtags) && !angular.equals(res.entities.hashtags,[]) ? res.entities.hashtags[0].text : type,
                type: type,
                description: res.text,
                location: 'Tempory Cat Country',
                date: res.created_at
              }
            };
          }
        });
        $scope.data.events = $scope.data.events.concat(events);
        $scope.data.events = _.compact($scope.data.events);
      }).catch(function (err) {
        console.log(err);
      });


  };

  $scope.fetchCrimeTweets = function (type) {
    console.log('fetchCrimeTweets')
    return DisasterTweets.crimeTweets()
      .then(function(response) {
        var tempTweets = [];
        _.each(response.data.statuses, function (res) {
          var tweet = _.pick(res,'created_at','text','user','geo','coordinates','place','entities');

          tweet.created_at = moment(res.created_at).format('MMM D, YYYY h:mm a');
          if (tweet.entities.hashtags.length > 0) { tweet.entities.hashtags = _.uniq(res.entities.hashtags, 'text'); }
          tweet.type = type;

          tempTweets.push(tweet);
          $scope.data.tweets.push(tweet);
        });
        var events = _.map(tempTweets, function (res) {
          if(res.coordinates) {
            return {
              id: uuid.v4(),
              'coords': {
                "latitude": res.coordinates.coordinates[1],
                "longitude": res.coordinates.coordinates[0]
              },
              options: {
                dragable: false,
                icon: {
                  url: getIcon({ code: type })
                }
              },
              data:  {
                name: angular.isDefined(res.entities) && angular.isDefined(res.entities.hashtags) && !angular.equals(res.entities.hashtags,[]) ? res.entities.hashtags[0].text : type,
                type: type,
                description: res.text,
                location: 'Tempory Cat Country',
                date: res.created_at
              }
            };
          }
        });
        $scope.data.events = $scope.data.events.concat(events);
        $scope.data.events = _.compact($scope.data.events);
      })
      .catch(function(err) {
        console.log(err);
      });
  };
  $scope.fetchDisasters = function() {
    return disasterService.getDisasters().then(function(res) {
      var disasters = _.chain(res.data)
        .filter(function(x) {
          return moment(x.date).isAfter('2014-01-01');
        })
        .filter(function (disaster) {
          return _.result(_.findWhere($scope.disasters, { 'type': getType(disaster.type) }), 'selected') === true ? true : false;
        })
        .filter(function (disaster) {
          if ($scope.query !== null && angular.isDefined($scope.query) && $scope.query !== "") {
            return _.contains(disaster.name, $scope.query);
          } else {
            return true;
          }
        })
        .map(function(disaster, i) {
          return {
            id: i,
            coords: {
              latitude: parseInt(disaster.location.lat, 10) + gen(),
              longitude: parseInt(disaster.location.long, 10) + gen()
            },
            options: {
              dragable: false,
              icon: {
                url: getIcon(disaster.type)
              }
            },
            data:  {
              name: disaster.name,
              type: getType(disaster.type),
              description: disaster.description,
              location: disaster.location.country,
              date: disaster.date
            }
          };
        })
        .value();
      $scope.data.events = $scope.data.events.concat(disasters);
    });
  };

  $scope.getData();
};