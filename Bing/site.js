var map;
var rectangles = [];
var center;
var stations = [];
var vehicles = [];
var latCenter;
var lngCenter;
var latMax;
var latMin;
var lngMax;
var lngMin;
var service;
var jsonDocumentsBing = [];

var map;

function loadMapScenario() {
    map = new Microsoft.Maps.Map(document.getElementById('myMap'), {});
}

function loadVehicles() {

    $.ajax({
        url: './documents.json',
        dataType: 'json',
        async: false,
        success: function (json) {
            jsonDocumentsBing = json;
        }
    });

    $.ajax({
        url: 'http://dev.virtualearth.net/REST/V1/Routes/OptimizeItinerary?key=YOUR_BING_KEY',
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {            
            Microsoft.Maps.loadModule('Microsoft.Maps.Directions', () => {                

                data.resourceSets[0].resources[0].agentItineraries.forEach((agentItinerary, index) => {
                    var directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
                    var route = agentItinerary.route.startLocation;
                    var startLocation = new Microsoft.Maps.Directions.Waypoint({ address: 'start Location', location: new Microsoft.Maps.Location(route.latitude, route.longitude) });

                    directionsManager.addWaypoint(startLocation);

                    agentItinerary.route.wayPoints.forEach((wayPoint) => {                        
                        var microsoftWaypoint = new Microsoft.Maps.Directions.Waypoint({ address: 'Itinarário ' + index, location: new Microsoft.Maps.Location(wayPoint.latitude, wayPoint.longitude) });

                        directionsManager.addWaypoint(microsoftWaypoint);
                    });
                    debugger;

                    var result = directionsManager.calculateDirections();
                });

                
            });
        },
        data: JSON.stringify(jsonDocumentsBing)
    });
}