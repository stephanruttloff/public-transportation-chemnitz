var app = angular.module("cvag", ["geolocation", "ngMap", "ngMaterial", "angularMoment", "timer", "ngCookies", "angular.filter"]);

app.factory("stationFactory", ["$http", function($http){
    return {
        getDepartures: function(stationId) {
            return $http.get('station/' + stationId).then(function(res){
                var station = res.data[0];
                return $http.get('departures/' + stationId).then(function(res){
                    station.stops = res.data.stops;
                    return station;
                }, function(error){
                    console.log(error);
                })
            }, function(error){
                console.error(error);
            })
        }
    }
}])

app.controller("main", [ "$scope", "$http", "$sce", "$compile", "$interval", "$timeout", "$cookieStore", "geolocation", "moment", "$mdSidenav", "$q", "$filter", "stationFactory",
                function($scope, $http, $sce, $compile, $interval, $timeout, $cookieStore, geolocation, moment, $mdSidenav, $q, $filter, stationFactory) {

//- GLOBALS --------------------------------------------------------------------

    $scope.favs = [];

    $scope.sidenav = {
        loading: true,
        isOpen: false
    }

    $scope.reactToMarker = true;

    $scope.selectedStation = {
        loading: true,
        displayName: 'Zentralhaltestelle'
    }

//- PRIVATE --------------------------------------------------------------------

    function attachEventListener(marker, station)
    {
        marker.station = station;

        if(marker.station.displayName == 'Zentralhaltestelle'){
            $scope.map.setCenter(marker.position);
            $scope.map.setZoom(15);
            $scope.selectedStation = marker.station;
            refreshStationData();
            if(!angular.isDefined($scope.refreshInterval))
                $scope.refreshInterval = $interval($scope.refreshStationData, 60000);
        }

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
        stationFactory.getDepartures($scope.selectedStation.id).then(function(station){
            $scope.selectedStation = station;
        })
    }

    function doReactToMarker()
    {
        $scope.reactToMarker = true;
    }

//- EVENTS ---------------------------------------------------------------------

    $scope.$on('mapInitialized', function(event, map) {

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
            /*
            var myLatLng = new google.maps.LatLng(data.coords.latitude, data.coords.longitude);
            map.setCenter(myLatLng);
            map.setZoom(15);
            var marker = new google.maps.Marker({
                position: myLatLng,
                map: map,
                title: 'Position',
                animation: google.maps.Animation.DROP
            });
            */
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