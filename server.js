var express = require('express')
var serveStatic = require('serve-static')
var request = require("request")
var moment = require("moment")

var app = express()

app.get('/departures/:stationId', GetDepartures)

app.use(serveStatic('./public', {'index': ['default.html', 'default.htm']}))
app.listen(80)

function GetDepartures(req, res)
{
	var stationId = req.params.stationId;
	// example url: 	http://www.cvag.de/eza/mis/stops/station/CAG-326
	// example referer: http://www.cvag.de/eza/liste.html?station=CAG-326

	request({
		uri: "http://www.cvag.de/eza/mis/stops/station/" + stationId,
		headers: {
			'Connection': 'keep-alive',
			'Accept': 'application/json, text/javascript, */*; q=0.01',
			'X-Requested-With': 'XMLHttpRequest',
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.134 Safari/537.36',
			'Referer': 'http://www.cvag.de/eza/liste.html?station=' + stationId,
			'Accept-Encoding': 'gzip, deflate, sdch',
			'Accept-Language': 'de,en-US;q=0.8,en;q=0.6,de-DE;q=0.4'
		}
	}, function(error, response, body) {
		res.json(body);
	});
}