var app = angular.module("cvag", ["geolocation", "ngMap", "ngMaterial", "angularMoment", "timer", "ngCookies"]);
app.controller("main", [ "$scope", "$http", "$sce", "$compile", "$interval", "$timeout", "$cookieStore", "geolocation", "moment", "$mdSidenav",
                function($scope, $http, $sce, $compile, $interval, $timeout, $cookieStore, geolocation, moment, $mdSidenav) {

//- GLOBALS --------------------------------------------------------------------

    $scope.favs = [];

    $scope.reactToMarker = true;

    $scope.selectedStation = {
        loading: true
    }

//- UI INTERACTION -------------------------------------------------------------

    $scope.toggleSidenav = function()
    {
        $mdSidenav('left').toggle();
    }

    $scope.fav = function(stationId, line, destination)
    {
        var i = getIndexOf($scope.favs, getFavKey(stationId, line, destination));
        if(i < 0)
            $scope.favs.push(getFavKey(stationId, line, destination))
        else
            $scope.favs.splice(i, 1);
        $cookieStore.put('favs', $scope.favs);
        getFavData();
        console.log($scope.favs);
    }

    $scope.isFav = function(stationId, line, destination)
    {
        return getIndexOf($scope.favs, getFavKey(stationId, line, destination)) >= 0;
    }

//- PRIVATE --------------------------------------------------------------------

    function getFavData()
    {
        /*
        if($scope.favViewModel.length == $scope.favs)
            return $scope.favViewModel;
        else
        {
            $scope.favViewModel.length = 0;
            for(var i = 0; i < $scope.favs.length; i++)
            {
                var fav = $scope.decodeFavKey($scope.favs[i]);
                $scope.favViewModel.push({
                    stationId: fav.stationId,
                    line: fav.line,
                    destination: fav.destination,
                    departure: 10
                })
            }
            return $scope.favViewModel;
        }
        */
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
                console.log(data);
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

        getFavData();
    });
}]);