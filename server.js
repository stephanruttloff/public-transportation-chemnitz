var express = require('express')
var serveStatic = require('serve-static')
var request = require('request')
var promise = require('promise')
var _ = require('underscore')
var fs = require('fs')

//------------------------------------------------------------------------------

var app = express()

//------------------------------------------------------------------------------

app.get('/departures/:stationId', function(req, res){
    var stationId = req.params.stationId;
    GetDepartures(stationId).then(function(departures){
        res.json(departures);
    }, function(error){
        console.error(error);
        res.json({});
    })
})
app.get('/departures/:stationId/:lineNr', function(req, res){
    var stationId = req.params.stationId;
    var lineNr = req.params.lineNr;
    GetDeparturesLine(stationId, lineNr).then(function(departures){
        res.json(departures);
    }, function(error){
        console.error(error);
        res.json({});
    })
})
app.get('/departures/:stationId/:lineNr/:destination', function(req, res){
    var stationId = req.params.stationId;
    var lineNr = req.params.lineNr;
    var destination = req.params.destination;
    GetDeparturesDestination(stationId, lineNr, destination).then(function(departures){
        res.json(departures);
    }, function(error){
        console.error(error);
        res.json({});
    })
})
app.get('/station/:stationId', function(req, res){
    var stationId = req.params.stationId;
    GetStationData(stationId).then(function(station){
        res.json(station);
    }, function(error){
        console.error(error);
        res.json({});
    })
})

//------------------------------------------------------------------------------

app.use(serveStatic(__dirname + '/public', {'index': ['index.html', 'index.htm']}))
app.listen(process.argv[2])

//------------------------------------------------------------------------------

function GetDepartures(stationId)
{
    return new promise(function(f, r){
        // example url:     http://www.cvag.de/eza/mis/stops/station/CAG-326
        // example referer: http://www.cvag.de/eza/liste.html?station=CAG-326
        request({
            uri: "http://www.cvag.de/eza/mis/stops/station/" + stationId,
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36',
                'Referer': 'http://www.cvag.de/eza/liste.html?station=' + stationId,
                'Accept-Encoding': 'gzip, deflate, sdch',
                'Accept-Language': 'de,en-US;q=0.8,en;q=0.6,de-DE;q=0.4'
            }
        }, function(error, response, body) {
            if(error) r(error);
            else
            {
                try{
                    var departures = JSON.parse(body);
                    f(departures);
                }catch(error){
                    r(error);
                }
            }
        });
    })
}

function GetDeparturesLine(stationId, lineNr)
{
    return new promise(function(f, r){
        GetDepartures(stationId).then(function(departures){
            var departuresForLine = _.where(departures.stops, {line: String(lineNr)});
            f(departuresForLine);
        }, function(error){
            r(error);
        })
    })
}

function GetDeparturesDestination(stationId, lineNr, destination)
{
    return new promise(function(f, r){
        GetDeparturesLine(stationId, lineNr).then(function(departures){
            var departuresWithDestination = _.where(departures, {destination: String(destination)});
            f(departuresWithDestination);
        }, function(error){
            r(error);
        })
    })
}

function GetStationData(stationId)
{
    return new promise(function(f, r){
        fs.readFile('src/resources/stops.json', function(error, data){
            if(error) r(error);
            else
            {
                try{
                    var stops = JSON.parse(data);
                    var station = _.where(stops.stations, {id: String(stationId)});
                    f(station);
                }catch(error){
                    r(error);
                }
            }
        })
    })
}