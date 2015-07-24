var app = angular.module("cvag", ["geolocation", "ngMap", "ngMaterial", "angularMoment", "timer"]);
app.controller("main", [ "$scope", "$http", "$sce", "$compile", "geolocation", "moment", function($scope, $http, $sce, $compile, geolocation, moment) {

    $scope.bottom = {
        title: "",
        content: "",
        show: false,
        height: 0
    }

    $scope.top = {
        height: 100
    }

    $scope.attachEventListener = function(marker, station)
    {
        marker.station = station;
        google.maps.event.addListener(marker, 'mousedown', function() {
            $scope.$apply(function(){
                var header = "<b>" + marker.station.displayName + "</b><br>";
                var loading = $compile("<md-progress-circular md-mode='indeterminate' style='margin-left:auto;margin-right:auto;'></md-progress-circular>")($scope)[0].outerHTML;
                var content = header + loading;
                $scope.map.infowindow.open($scope.map, marker);
                $scope.map.infowindow.setContent(content);

                $http.get('departures/' + marker.station.id).success(function(data) {
                    var d = angular.fromJson(data);
                    var now = new moment(d.now);
                    var table = "<table><tr><th>Linie</th><th>Richtung</th><th>Abfahrt</th></tr>";
                    for(var i = 0; i < d.stops.length; i++)
                    {
                        table += "<tr>"

                        var diff = new moment(d.stops[i].actualDeparture).diff(now, 'Minutes');
                        table += "<td>" + d.stops[i].line + "</td>";
                        table += "<td>" + d.stops[i].destination + "</td>";
                        table += "<td text-align='right'><timer max-time-unit=\"'minute'\" end-time='" + d.stops[i].actualDeparture + "'>{{mminutes}}:{{sseconds}}</timer></td>";
                        //table += "<td>" + diff + "</td>";

                        table += "</tr>"
                    }
                    table += "</table>";
                    var content = "<div>" + header + table + "</div>"
                    content = $compile(content)($scope);
                    $scope.map.infowindow.setContent(content[0]);
                });
            })
        });
    }

    $scope.$on('mapInitialized', function(event, map) {
        map.infowindow = new google.maps.InfoWindow({
            content: ""
        });

        geolocation.getLocation().then(function(data){
            var myLatLng = new google.maps.LatLng(data.coords.latitude, data.coords.longitude);
            map.setCenter(myLatLng);
            map.setZoom(15);
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