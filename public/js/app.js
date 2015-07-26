var app = angular.module("cvag", ["geolocation", "ngMap", "ngMaterial", "angularMoment", "timer", "ngCookies"]);
app.controller("main", [ "$scope", "$http", "$sce", "$compile", "$interval", "$timeout", "$cookieStore", "geolocation", "moment", "$mdSidenav",
                function($scope, $http, $sce, $compile, $interval, $timeout, $cookieStore, geolocation, moment, $mdSidenav) {

    $scope.favs = $cookieStore.get('favs');
    if(angular.isUndefined($scope.favs))
        $scope.favs = [];
    $scope.favViewModel = [];

    $scope.menu = {
        open: false
    }

    $scope.reactToMarker = true;

    $scope.selectedStation = {
        loading: true
    }

    $scope.mapInitDone = false;

    $scope.onMenuClick = function()
    {
        $scope.menu.open = !$scope.menu.open;
    }

    $scope.onFavClick = function()
    {
        $mdSidenav('right').toggle();
    }

    $scope.getFavData = function()
    {
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
                    destination: fav.destination
                })
            }
            return $scope.favViewModel;
        }
    }

    $scope.getIndexOf = function(array, object)
    {
        for(var i = 0; i < array.length; i++)
            if(array[i] == object) return i;
        return -1;
    }

    $scope.getFavKey = function(stationId, line, destination)
    {
        return stationId + "|" + line + "|" + destination;
    }

    $scope.decodeFavKey = function(favKey)
    {
        var parts = favKey.split("|");
        return {
            stationId: parts[0],
            line: parts[1],
            destination: parts[2]
        }
    }

    $scope.isFav = function(stationId, line, destination)
    {
        return $scope.getIndexOf($scope.favs, $scope.getFavKey(stationId, line, destination)) >= 0;
    }

    $scope.fav = function(stationId, line, destination)
    {
        var i = $scope.getIndexOf($scope.favs, $scope.getFavKey(stationId, line, destination));
        if(i < 0)
            $scope.favs.push($scope.getFavKey(stationId, line, destination))
        else
            $scope.favs.splice(i, 1);
        $cookieStore.put('favs', $scope.favs);
        $scope.getFavData();
        console.log($scope.favViewModel);
    }

    $scope.attachEventListener = function(marker, station)
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

                    $scope.refreshStationData();

                    if(!angular.isDefined($scope.refreshInterval))
                        $scope.refreshInterval = $interval($scope.refreshStationData, 60000);
                });
            };
        });
    };

    $scope.refreshStationData = function()
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

    $scope.doReactToMarker = function()
    {
        $scope.reactToMarker = true;
    }

    $scope.$on('mapInitialized', function(event, map) {
        var markers = [];
        var input = /** @type {HTMLInputElement} */(document.getElementById('pac-input'));
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
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
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(menu);

        google.maps.event.addListener(map, 'bounds_changed', function() {
            var bounds = map.getBounds();
            searchBox.setBounds(bounds);
        });

        google.maps.event.addListener(map, 'zoom_changed', function() {
            $scope.reactToMarker = false;
            $timeout($scope.doReactToMarker, 500);
        })

        google.maps.event.addListener(map, 'dragstart', function() {
            $scope.reactToMarker = false;
        })

        google.maps.event.addListener(map, 'dragend', function() {
            $timeout($scope.doReactToMarker, 500);
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
                $scope.attachEventListener(marker, stations[i]);
            }
        });

        $scope.mapInitDone = true;

        $scope.getFavData();
    });
}]);