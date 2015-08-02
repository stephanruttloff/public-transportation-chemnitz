var app = angular.module("cvag", ["geolocation", "ngMap", "ngMaterial", "angularMoment", "timer", "ngCookies", "angular.filter"]);
app.controller("main", [ "$scope", "$http", "$sce", "$compile", "$interval", "$timeout", "$cookieStore", "geolocation", "moment", "$mdSidenav", "$q", "$filter",
                function($scope, $http, $sce, $compile, $interval, $timeout, $cookieStore, geolocation, moment, $mdSidenav, $q, $filter) {

//- GLOBALS --------------------------------------------------------------------

    $scope.favs = [];

    $scope.sidenav = {
        loading: true,
        isOpen: false
    }

    $scope.reactToMarker = true;

    $scope.selectedStation = {
        loading: true
    }

//- UI INTERACTION -------------------------------------------------------------

    $scope.toggleSidenav = function()
    {
        if($scope.sidenav.isOpen)
           $scope.favs.length = 0;
        else
            loadFavsAsync();
        $mdSidenav('left').toggle();
    }

    $scope.fav = function(stationId, line, destination)
    {
        var favs = getFavs();

        var i = getIndexOf(favs, getFavKey(stationId, line, destination));
        if(i < 0)
            favs.push(getFavKey(stationId, line, destination))
        else
            favs.splice(i, 1);
        setFavs(favs);
    }

    $scope.isFav = function(stationId, line, destination)
    {
        var favs = getFavs();
        return getIndexOf(favs, getFavKey(stationId, line, destination)) >= 0;
    }

//- PRIVATE --------------------------------------------------------------------

    function getFavs()
    {
        var favs = $cookieStore.get('favs');
        if(angular.isUndefined(favs))
            favs = [];
        return favs;
    }

    function setFavs(favs)
    {
        $cookieStore.put('favs', favs);
    }

    function loadFavsAsync()
    {
        $scope.sidenav.loading = true;
        var favs = getFavs();
        if(favs.length == 0)
            $scope.sidenav.loading = false;
        var promises = [];
        for(var i = 0; i < favs.length; i++)
        {
            var decoded = decodeFavKey(favs[i]);
            var p = getFavDataAsync(decoded);
            promises.push(p);
        }
        $q.all(promises).then(function(results){
            $scope.favs.length = 0;
            for(var i = 0; i < results.length; i++)
            {
                var found = $filter('filter')($scope.favs, {stationId: results[i].stationId}, true);

                var entry = {};

                if(found.length > 0)
                    entry = found[0];
                else{
                    entry = {stationId: results[i].stationId, displayName: results[i].displayName, departures: []};
                    $scope.favs.push(entry);
                }

                for(var j = 0; j < results[i].departures.length; j++)
                {
                    var departure = results[i].departures[j];
                    departure.destination = results[i].destination;
                    departure.line = results[i].line;
                    entry.departures.push(departure);
                }

                $scope.sidenav.loading = false;
            }
        }, function(error){
            console.error(error);
            $scope.favs.length = 0;
            $scope.sidenav.loading = false;
        })
    }

    function getFavDataAsync(decoded)
    {
        return $q(function(f, r){
            $http.get('station/' + decoded.stationId).then(function(response){
                try{
                    decoded.displayName = response.data[0].displayName;
                    decoded.departures = [];
                    $http.get(
                        'departures/' +decoded.stationId +
                        '/' + decoded.line +
                        '/' + decoded.destination).then(function(response){
                            for(var i = 0; i < response.data.length; i++)
                            {
                                decoded.departures.push({
                                    serviceType: response.data[i].serviceType,
                                    actualDeparture: response.data[i].actualDeparture
                                });
                            }
                            f(decoded);
                        }, function(error){
                            r(error);
                        })

                }catch(error){
                    r(error);
                }
            }, function(error){
                r(error);
            })
        });
    }

    function getIndexOf(array, object)
    {
        for(var i = 0; i < array.length; i++)
            if(array[i] == object) return i;
        return -1;
    }

    function getFavKey(stationId, line, destination)
    {
        return stationId + "|" + line + "|" + destination;
    }

    function decodeFavKey(favKey)
    {
        var parts = favKey.split("|");
        return {
            stationId: parts[0],
            line: parts[1],
            destination: parts[2]
        }
    }

    function attachEventListener(marker, station)
    {
        marker.station = station;
        google.maps.event.addListener(marker, 'mouseup', function() {
            if($scope.reactToMarker)
            {
                $scope.map.setOptions({draggable: false});
                $scope.$apply(function(){
                    if($scope.map.infowindow.getContent() === "")
                    {
                        var content = $compile("<div ng-include=\"'partials/infowindow.html'\"></div>")($scope)[0];
                        $scope.map.infowindow.setContent(content);
                    }
                    $scope.map.infowindow.open($scope.map, marker);

                    $scope.selectedStation.loading = true;
                    $scope.selectedStation  = marker.station;

                    refreshStationData();

                    if(!angular.isDefined($scope.refreshInterval))
                        $scope.refreshInterval = $interval($scope.refreshStationData, 60000);
                });
            };
        });
    };

    function refreshStationData()
    {
        $http.get('departures/' + $scope.selectedStation.id).success(function(data) {
            try{
                station = angular.fromJson(data);
            }catch(err){
                console.error(data);
            }
            $scope.selectedStation.now = station.now;
            $scope.selectedStation.stops = station.stops;
            $scope.selectedStation.loading = false;
            $scope.map.setOptions({draggable: true});
        });
    }

    function doReactToMarker()
    {
        $scope.reactToMarker = true;
    }

//- EVENTS ---------------------------------------------------------------------

    $scope.$on('mapInitialized', function(event, map) {
        var markers = [];
        var input = /** @type {HTMLInputElement} */(document.getElementById('pac-input'));
        var searchBox = new google.maps.places.SearchBox(/** @type {HTMLInputElement} */(input));
        google.maps.event.addListener(searchBox, 'places_changed', function() {
            var places = searchBox.getPlaces();

            if (places.length == 0) {
              return;
            }
            for (var i = 0, marker; marker = markers[i]; i++) {
              marker.setMap(null);
            }

            // For each place, get the icon, place name, and location.
            markers = [];
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0, place; place = places[i]; i++) {
                var image = {
                    url: place.icon,
                    size: new google.maps.Size(71, 71),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };

                // Create a marker for each place.
                var marker = new google.maps.Marker({
                    map: map,
                    icon: image,
                    title: place.name,
                    position: place.geometry.location
                });

                markers.push(marker);

                bounds.extend(place.geometry.location);
            }

            map.fitBounds(bounds);
        });
        var menu = /** @type {HTMLInputElement} */(document.getElementById('pac-menu'));

        google.maps.event.addListener(map, 'bounds_changed', function() {
            var bounds = map.getBounds();
            searchBox.setBounds(bounds);
        });

        google.maps.event.addListener(map, 'zoom_changed', function() {
            $scope.reactToMarker = false;
            $timeout(doReactToMarker, 500);
        })

        google.maps.event.addListener(map, 'dragstart', function() {
            $scope.reactToMarker = false;
        })

        google.maps.event.addListener(map, 'dragend', function() {
            $timeout(doReactToMarker, 500);
        })

        map.infowindow = new google.maps.InfoWindow({
            content: ""
        });

        google.maps.event.addListener(map.infowindow,'closeclick',function(){
            if(angular.isDefined($scope.refreshInterval))
                $interval.cancel($scope.refreshInterval);
        });

        geolocation.getLocation().then(function(data){
            var myLatLng = new google.maps.LatLng(data.coords.latitude, data.coords.longitude);
            map.setCenter(myLatLng);
            map.setZoom(15);
            var marker = new google.maps.Marker({
                position: myLatLng,
                map: map,
                title: 'Position',
                animation: google.maps.Animation.DROP
            });
        });

        $http.get('resources/stops.json').success(function(data) {
            var stations = data.stations;
            var image = new google.maps.MarkerImage('img/CVAG@2x.png', null, null, null, new google.maps.Size(25,41));;

            for(i = 0; i < stations.length; i++)
            {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(stations[i].latitude, stations[i].longitude),
                    map: map,
                    title: stations[i].displayName,
                    icon: image
                });
                attachEventListener(marker, stations[i]);
            }
        });
    });
}]);