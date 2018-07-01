var ajax = require('ajax');

var Futar = {};

Futar.fetchStops = function(latitude, longitude, callback) {
  Futar.latitude = latitude;
  Futar.longitude = longitude;

  Futar.callback = callback;

  Futar._fetchStops();
};


Futar._fetchStops = function() {
  ajax(Futar._departuresUrl(), Futar._parseStops, Futar._handleError);
};


Futar._parseStops = function(raw) {
  var resp = JSON.parse(raw);

  function getDistanceFromLatLonInM(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d * 1000;
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  var stopTimes = resp.data.list.map(function(x) { return x.stopTimes; });
  stopTimes = [].concat.apply([], stopTimes);

  var stopIds = stopTimes.map(function(x) { return x.stopId; }).filter(onlyUnique);
  var stops = resp.data.references.stops.filter(function(x) { return stopIds.indexOf(x.id) !== -1; });

  stops = stops.map(function(stop) {
    stop.distance = getDistanceFromLatLonInM(Futar.latitude, Futar.longitude, stop.lat, stop.lon);
    return stop;
  });

  var stopsInfo = stops.reduce(function (res, stop) {
      var identifier = stop.parentStationId;
      res[identifier] = res[identifier] || { stops: [] };
      res[identifier].name = res[identifier].name || stop.name;

      if (stop.name.length <= res[identifier].name.length) {
        res[identifier].name = stop.name;
      }

      res[identifier].stops.push(stop);
      return res;
  }, {});

  stopsInfo = Object.keys(stopsInfo).map(function(key) { return stopsInfo[key]; });

  stopsInfo = stopsInfo.map(function(info) {
    var totalDist = info.stops.reduce(function(sum, stop) { return sum + stop.distance; }, 0);
    info.distance = totalDist / info.stops.length;

    return info;
  });

  stopsInfo = stopsInfo.map(function(info) {
    var departures = resp.data.list.reduce(function(res, dep) {
      dep.stopTimes.forEach(function(stopTime) {
        res.push({ routeId: dep.routeId, stopTime: stopTime, headsign: dep.headsign });
      });

      return res;
    }, []);

    departures = departures.filter(function(dep) {
      var stopIds = info.stops.map(function(stop) { return stop.id; });
      return stopIds.indexOf(dep.stopTime.stopId) >= 0;
    });

    departures = departures.map(function(departure) {
      var route = resp.data.references.routes.filter(function(route) { return route.id === departure.routeId; })[0];

      var arrivalTime = departure.stopTime.predictedArrivalTime || departure.stopTime.arrivalTime;
      var departureTime = departure.stopTime.predictedDepartureTime || departure.stopTime.departureTime;

      return {
        arrivalTime: arrivalTime || departureTime,
        headsign: departure.headsign,
        route: route
      };
    });


    departures = departures.filter(function(dep) { return dep.arrivalTime; } );
    departures = departures.sort(function(x, y) { return x.arrivalTime - y.arrivalTime; });

    info.departures = departures;

    return info;
  });

  var sortedStopsInfo = stopsInfo.sort(function(x, y) { return x.distance - y.distance; });

  var alerts = resp.data.references.alerts.map(function(alertInfo) {
    var alert = {};

    alert.routes = alertInfo.routeIds.map(function(routeId) {
      var routes = resp.data.references.routes.filter(function(r) { return r.id === routeId; });
      return routes.map(function(route) { return (route.shortName || route.longName); }).join();
    });

    alert.header = alertInfo.header.someTranslation;
    alert.description = alertInfo.description.someTranslation;
    alert.from = alertInfo.startText.someTranslation;
    alert.until = alertInfo.endText.someTranslation;

    return alert;
  });

  Futar.callback({ stops: sortedStopsInfo, alerts: alerts });
};


Futar._handleError = function(error) {
  Futar.callback({ stops: [], error: error });
};


Futar._departuresUrl = function() {
  return 'http://futar.bkk.hu/0/m/al.json?' +
         'limit=-1' +
         '&groupLimit=4' +
         '&minutesBefore=0' +
         '&minutesAfter=60' +
         '&latSpan=0.0030' +
         '&lonSpan=0.0050' +
         '&lat=' + Futar.latitude +
         '&lon=' + Futar.longitude +
         '&clientLat=' + Futar.latitude +
         '&clientLon=' + Futar.longitude;
};


Futar._tripUrl = function(tripId) {
  return 'http://futar.bkk.hu/0/m/td.json?' +
         'tripId=' + tripId;
};


module.exports = { fetchStops: Futar.fetchStops };
