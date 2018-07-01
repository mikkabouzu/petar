require('./util');

var UI = require('ui');
var Vibe = require('ui/vibe');

var Futar = require('./futar');
var moment = require('vendor/moment');

function fillStopMenuWith(stopMenu, stops) {
  var now = moment();

  var stopTitles = stops.map(function(stop) {
    return { title: stop.name.withFixedAccents(),
             subtitle: Math.round(stop.distance) + 'm' };
  });


  stopMenu.section(0, { title: 'Stops nearby (' + stops.length + ')',
                        items: stopTitles });

  stopMenu.on('select', function(event) {
    var stop = stops[event.itemIndex];

    var departures = stop.departures.map(function(departure) {
      var arrival = moment.unix(departure.arrivalTime);
      var duration = moment.duration(arrival.diff(now));
      var vehicle = (departure.route.shortName || departure.route.longName).padStart(3);
      var minutes = Math.round(duration.asMinutes());
      var arrivalText = minutes <= 0 ? 'NOW' : minutes + "'";
      var numOfSpaces = 18 - vehicle.length - arrivalText.length;
      var title = vehicle + ' '.repeat(numOfSpaces) + arrivalText;
      var subtitle = '> ' + departure.headsign;

      return {
        title: title.withFixedAccents(),
        subtitle: subtitle.withFixedAccents(),
        backgroundColor: '#' + departure.route.color,
        textColor: '#' + departure.route.textColor,
        icon: 'images/' + departure.route.type + '.png'
      };
    });

    var departuresMenu = new UI.Menu();
    departuresMenu.section(0, {
      title: stop.name.withFixedAccents(),
      items: departures }
    );

    departuresMenu.show();
  });
}

function loadStops(splashScreen, stopMenu, errorScreen) {
  splashScreen.show();
  stopMenu.hide();

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      console.log('SRV: Location: ' + pos.coords.latitude + ', ' +  pos.coords.longitude);

      // HUN coordinates for cloudpebble testing
//       pos = { coords: {
//         latitude: 47.4924430302,
//         longitude: 19.0527914555
//       }};

      Futar.fetchStops(pos.coords.latitude, pos.coords.longitude, function(resp) {
        var stops = resp.stops;

        if (stops.length > 0) {
          fillStopMenuWith(stopMenu, stops);
          stopMenu.show();
        } else {
          errorScreen.show();
        }

        splashScreen.hide();
        Vibe.vibrate('double');
      });
    },
    function (err) {
        console.warn('SRV: Location error (' + err.code + '): ' + err.message);

        errorScreen.show();
        splashScreen.hide();
    },
    {
      'timeout': 10000,
      'maximumAge': 0,
      'enableHighAccuracy': true
    }
  );
}

// ---

var splashScreen = new UI.Card({ title: 'working hard',
                                 subtitle: '...loading stuff...' });
var errorScreen = new UI.Card({ title: '🙀🙀🙀🙀🙀🙀',
                                body: 'there are no BKV vehicles nearby (for at least an hour)',
                                titleColor: 'white',
                                subtitleColor: 'white',
                                bodyColor: 'white',
                                backgroundColor: 'dark-candy-apple-red' });
var stopMenu = new UI.Menu();


loadStops(splashScreen, stopMenu, errorScreen);
