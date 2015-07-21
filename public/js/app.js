var app = angular.module("cvag", ["leaflet-directive", "geolocation"]);
app.controller("main", [ "$scope", "$http", "leafletData", "leafletBoundsHelpers", "geolocation", function($scope, $http, leafletData, leafletBoundsHelpers, geolocation) {

	var bounds = leafletBoundsHelpers.createBoundsFromArray([
        [ 50.6, 12.5 ],
        [ 50.95, 13.1 ]
    ]);
    angular.extend($scope, {
    	bounds: bounds,
        //maxbounds: bounds,
        center: {},
        defaults: {
            scrollWheelZoom: false
        },
        layers: {
            baselayers: {
                googleTerrain: {
                    name: 'Google Terrain',
                    layerType: 'TERRAIN',
                    type: 'google'
                },
                googleHybrid: {
                    name: 'Google Hybrid',
                    layerType: 'HYBRID',
                    type: 'google'
                },
                googleRoadmap: {
                    name: 'Google Streets',
                    layerType: 'ROADMAP',
                    type: 'google'
                }
            }
        }
    });


    $http.get('resources/stops.json').success(function(data) {
    	var stations = (data.stations);
	   	var markers = {};
	   	for(i = 0; i < stations.length; i++)
	   	{
	   		var message = '<b>' + stations[i].displayName + '</b><br>' +
	   					  '<iframe src="http://www.cvag.de/eza/liste.html?station=' + stations[i].id + '"></iframe>';
	   		markers[i] = {
	   			lat:stations[i].latitude,
	   			lng:stations[i].longitude,
	   			message: message,
	   			focus: false,
	   			draggable: false
	   		};
	   	}
	   	angular.extend($scope, {
	        markers: markers
	    });
	});
	geolocation.getLocation().then(function(data){
    	$scope.center = {
            lat: data.coords.latitude,
            lng: data.coords.longitude,
            zoom: 17
	    }
    });
}]);