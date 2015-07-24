var app = angular.module("cvag", ["geolocation", "ngMap", "ngMaterial", "angularMoment", "timer"]);
app.controller("main", [ "$scope", "$http", "$sce", "$compile", "$interval", "geolocation", "moment", function($scope, $http, $sce, $compile, $interval, geolocation, moment) {

    $scope.selectedStation = {
        loading: true
    }

    $scope.attachEventListener = function(marker, station)
    {
        marker.station = station;
        google.maps.event.addListener(marker, 'mousedown', function() {
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
            })
        });
    }

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

    $scope.$on('mapInitialized', function(event, map) {
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
    });
}]);