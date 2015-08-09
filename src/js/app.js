var app = angular.module("cvag",
    [
        "geolocation",
        "ngMap",
        "ngMaterial",
        "angularMoment",
        "timer",
        "ngCookies",
        "angular.filter",
        "ngRoute",
        "angular-cache",
        "cfp.hotkeys",
        "ngTouch",
        "ngAnimate"
    ]
);

app.directive("fadeHelper", function() {

    function compile($element, attributes, transclude){
        $element.prepend("<img class='fader' />");
        return(link);
    }

    function link($scope, $element, attributes){
        var fader = angular.element($element[0].querySelector('.fader'));
        var primary = angular.element($element[0].querySelector('.image'));

        $scope.$watch("station.id", function( newValue, oldValue ) {
                if (newValue === oldValue ||
                    isFading())
                    return;

                initFade( 'map/header/' + oldValue );
            }
        );

        function initFade( fadeSource ){
            fader.prop( "src", fadeSource ).addClass( "show" );
            primary.one( "load", startFade );
        }

        function isFading(){
            return(fader.hasClass( "show" ) || fader.hasClass( "fadeOut" ));
        }

        function startFade() {
            fader.addClass("fadeOut");
            setTimeout(teardownFade, 250);
        }

        function teardownFade(){
            fader.removeClass("show fadeOut");
        }
    }

    return({
        compile: compile,
        restrict: "A"
    });
});

app.factory("stationFactory", ["$rootScope", "$http", "$filter", "CacheFactory", "geolocation", function($rootScope, $http, $filter, CacheFactory, geolocation){
    if(!CacheFactory.get('localStationData'))
    {
        CacheFactory.createCache('localStationData', {
            deleteOnExpire: 'aggressive',
            recycleFreq: 60000
        })
    }

    var localStationDataCache = CacheFactory.get('localStationData');

    var factoryObj = {};

    factoryObj.getDepartures = function(stationId) {
        return $http.get('station/' + stationId, {cache: localStationDataCache}).then(function(res){
            var station = res.data[0];
            return $http.get('departures/' + stationId).then(function(res){
                station.stops = res.data.stops;
                return station;
            }, function(error){
                console.error(error);
            })
        }, function(error){
            console.error(error);
        })
    }
    factoryObj.getLocalStationData = function() {
        return $http.get('resources/stops.json').then(function(res){
            return res.data.stations;
        }, function(error){
            console.error(error);
        })
    }
    factoryObj.getStationsByDistance = function() {
        return factoryObj.getLocalStationData().then(function(stations){
            return geolocation.getLocation().then(function(data){
                $rootScope.locationEnabled = true;
                var myLatLng = new google.maps.LatLng(data.coords.latitude, data.coords.longitude);
                for(var i = 0; i < stations.length; i++){
                    var station = stations[i];
                    var to = new google.maps.LatLng(station.latitude, station.longitude);
                    var dist = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, to);
                    station.distance = dist;
                }
                return $filter('orderBy')(stations, 'distance', false);
            }, function(error){
                console.error(error);
                var myLatLng = new google.maps.LatLng(50.83159596666668, 12.922535166666668);
                for(var i = 0; i < stations.length; i++){
                    var station = stations[i];
                    var to = new google.maps.LatLng(station.latitude, station.longitude);
                    var dist = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, to);
                    station.distance = dist;
                }
                return $filter('orderBy')(stations, 'distance', false);
            });
        }, function(error){
            console.error(error);
        })
    }
    factoryObj.getIndexOfById = function(id, array) {
        if(!angular.isDefined(array))
            return -1;
        for(var i = 0; i < array.length; i++){
            if(array[i].id == id) return i;
        }
        return -1;
    }

    return factoryObj;
}])

app.config(["$routeProvider", "CacheFactoryProvider", function($routeProvider, CacheFactoryProvider){
    angular.extend(CacheFactoryProvider.defaults, { maxAge: 15 * 60 * 1000 });

    $routeProvider.
        when('/station/:stationId', {
            templateUrl: 'partials/station.html',
            controller: 'StationController'
        }).
        when('/overview', {
            templateUrl: 'partials/overview.html',
            controller: 'OverviewController'
        }).
        when('/nearest', {
            templateUrl: 'partials/nearest.html',
            controller: 'NearestController'
        }).
        when('/usage', {
            templateUrl: 'partials/usage.html',
            controller: 'UsageController'
        }).
        otherwise({
            redirectTo: '/nearest'
        });
}])

app.controller("UsageController", ["$rootScope", "$scope", "$interval", function($rootScope, $scope, $interval){
    $rootScope.showMap = false;
    if(angular.isDefined($rootScope.refreshInterval))
        $interval.cancel($rootScope.refreshInterval);
}])

app.controller("NearestController", ["$rootScope", "$scope", "$location", "$filter", "$interval", "geolocation", "stationFactory", function($rootScope, $scope, $location, $filter, $interval, geolocation, stationFactory){
    $rootScope.showMap = false;
    if(angular.isDefined($rootScope.refreshInterval))
        $interval.cancel($rootScope.refreshInterval);

    stationFactory.getStationsByDistance().then(function(stations){
        $rootScope.stations = stations;
        $location.path('station/' + stations[0].id);
    }, function(error){
        console.error(error);
        $location.path('station/CAG-131');
    });
}])

app.controller("StationController", ["$rootScope", "$scope", "$routeParams", "$location", "$interval", "stationFactory", "hotkeys", function($rootScope, $scope, $routeParams, $location, $interval, stationFactory, hotkeys){

    $scope.loading = true;
    $rootScope.showMap = true;

    $scope.prevStation = function(){
        //$rootScope.swipeDirection = 'ltr';
        var i = stationFactory.getIndexOfById($routeParams.stationId, $rootScope.stations);
        if(i - 1 < 0) return;
        var prev = $rootScope.stations[i - 1];
        $location.path('station/' + prev.id);
    }
    $scope.nextStation = function(){
        //$rootScope.swipeDirection = 'rtl';
        var i = stationFactory.getIndexOfById($routeParams.stationId, $rootScope.stations);
        if(!angular.isDefined($rootScope.stations) || i + 1 > $rootScope.length - 1) return;
        var next = $rootScope.stations[i + 1];
        $location.path('station/' + next.id);
    }
    hotkeys.bindTo($scope).add({
        combo: "left",
        description: "Nächste Haltestelle",
        callback: function(){$scope.prevStation()}
    }).add({
        combo: "right",
        description: "Vorherige Haltestelle",
        callback: function(){$scope.nextStation()}
    })
    if(!angular.isDefined($rootScope.stations)){
        stationFactory.getStationsByDistance().then(function(stations){
            $rootScope.stations = stations;
            if(angular.isDefined($scope.station))
                $scope.station.distance = getDistance($scope.station, stations);
        }, function(error){
            console.error(error);
        })
    }
    function getDistance(currentStation, stationsByDistance)
    {
        for(var i = 0; i < stationsByDistance.length; i++){
            if(stationsByDistance[i].id != currentStation.id)
                continue;
            return stationsByDistance[i].distance;
        }
    }
    function getDepartures(){
        return stationFactory.getDepartures($routeParams.stationId).then(function(station){
            $rootScope.station = station;
            if(angular.isDefined($rootScope.stations))
                $rootScope.station.distance = getDistance($rootScope.station, $rootScope.stations)
            $scope.loading = false;
            var position = new google.maps.LatLng(station.latitude, station.longitude);
            var cvagMarker = new google.maps.MarkerImage('img/CVAG@2x.png', null, null, null, new google.maps.Size(25,41));
            if(angular.isDefined($rootScope.marker)){
                $rootScope.marker.setPosition(position);
                $rootScope.marker.setTitle(station.displayName);
            }else{
                $rootScope.marker = new google.maps.Marker({
                    position: position,
                    title: station.displayName,
                    animation: google.maps.Animation.DROP,
                    icon: cvagMarker
                });
            }
        }, function(error){
            console.error(error);
        })
    }
    getDepartures();
    if(angular.isDefined($rootScope.refreshInterval))
        $interval.cancel($rootScope.refreshInterval);
    $rootScope.refreshInterval = $interval(function(){
        getDepartures();
    }, 60000);
}]);

app.controller("OverviewController", ["$rootScope", "$scope", "$location", "$timeout", "$interval", "stationFactory", "geolocation", function($rootScope, $scope, $location, $timeout, $interval, stationFactory, geolocation){
    $rootScope.showMap = false;

    $rootScope.swipeDirection = '';
    $scope.reactToMarker = true;

    if(angular.isDefined($rootScope.refreshInterval))
        $interval.cancel($rootScope.refreshInterval);

    function attachEventListener(marker, station) {
        google.maps.event.addListener(marker, 'mouseup', function() {
            if($scope.reactToMarker) {
                $location.path('/station/' + station.id);
                $scope.$apply();
            }
        });
    };

    $scope.$on('mapInitialized', function(event, map) {

        google.maps.event.addListener(map, 'zoom_changed', function() {
            $scope.reactToMarker = false;
            $timeout(function(){$scope.reactToMarker = true;}, 500);
        })

        google.maps.event.addListener(map, 'dragstart', function() {
            $scope.reactToMarker = false;
        })

        google.maps.event.addListener(map, 'dragend', function() {
            $timeout(function(){$scope.reactToMarker = true;}, 500);
        })

        stationFactory.getLocalStationData().then(function(stations){
            var image = new google.maps.MarkerImage('img/CVAG@2x.png', null, null, null, new google.maps.Size(25,41));

            for(i = 0; i < stations.length; i++)
            {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(stations[i].latitude, stations[i].longitude),
                    map: map,
                    title: stations[i].displayName
                });
                if(angular.isDefined($rootScope.station) && $rootScope.station.id == stations[i].id){
                    marker.setLabel(stations[i].displayName[0])
                }
                else
                    marker.setIcon(image);
                attachEventListener(marker, stations[i]);
            }
        }, function(error){
            console.error(error);
        })

        geolocation.getLocation().then(function(data){
            var myLatLng = new google.maps.LatLng(data.coords.latitude, data.coords.longitude);
            var positionMarker = new google.maps.Marker({
                position: myLatLng,
                map: map,
                title: 'You are here',
                label: '',
                animation: google.maps.Animation.DROP
            })
            map.setCenter(myLatLng);
            map.setZoom(15);
        })
    });
}])