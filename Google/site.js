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

var quadrant = new Quadrant();

function initMap() {
    service = new google.maps.DirectionsService;
    map = new google.maps.Map(document.getElementById('map'));

    $.ajax({
        url: '../GoogleAPI/documents.json',
        dataType: 'json',
        async: false,
        success: function (json) {
            quadrant.deliveries = json.documents;
            quadrant.initMap();
        }
    });

    $.ajax({
        url: '../GoogleAPI/vehicles.json',
        dataType: 'json',
        async: false,
        success: function (json) {
            vehicles = json.vehicles;
        }
    });

    showAllDeliveriesOnQuadrants();

    // Show stations on the map as markers

    for (var i = 0; i < vehicles.length; i++) {
        var myLatLng = { lat: vehicles[i].lat, lng: vehicles[i].lng };
        new google.maps.Marker({
            position: myLatLng,
            icon: "https://ruma-home.com/v2/wp-content/uploads/2016/03/icon-truck-e1471234571201.png",
            map: map,
            title: vehicles[i].description
        });
    }
}

function loadVehicles() {
    this.vehicles.forEach((vehicle, index) => {
        while (vehicle.deliveries.length < vehicle.maxAWB && this.quadrant.deliveries.length > 0) {

            var deliveriesInserted = [];
            var shortestDistanceToDeliver;

            //CASO O VEÍCULOS NÃO POSSUA ENTREGAS, PEGA TODAS AS ENTREGAS DO PRIMEIRO QUADRANTE
            if (vehicle.deliveries.length == 0) {
                shortestDistanceToDeliver = this.quadrant.deliveries.map(m => m).reduce((a, b) => getDistanceFromLatLonInKm(vehicle.lat, vehicle.lng, a.lat, a.lng) < getDistanceFromLatLonInKm(vehicle.lat, vehicle.lng, b.lat, b.lng) ? a : b);
            }
            else {
                //VERIFICA QUAL É A ENTREGA MAS DISTANTE A PARTIR DA ORIGEM DO VEÍCULO, POIS ELA SERIA A ÚLTIMA ENTREGA DO QUADRANTE A SER ENTREGUE
                var maxDistanceOnVehicle = vehicle.deliveries.map(m => m).reduce((a, b) => getDistanceFromLatLonInKm(vehicle.lat, vehicle.lng, a.lat, a.lng) > getDistanceFromLatLonInKm(vehicle.lat, vehicle.lng, b.lat, b.lng) ? a : b);
                //VERIFICA QUAL É A DISTÂNCIA MAIS CURTA A PARTIR DA ENTREGA MAIS DISTANTE DO ÚLTIMO QUADRANTE PARA BUSCAR ONDE ELA ESTÁ NO QUADRANTE SEGUINTE
                shortestDistanceToDeliver = this.quadrant.deliveries.map(m => m).reduce((a, b) => getDistanceFromLatLonInKm(maxDistanceOnVehicle.lat, maxDistanceOnVehicle.lng, a.lat, a.lng) < getDistanceFromLatLonInKm(maxDistanceOnVehicle.lat, maxDistanceOnVehicle.lng, b.lat, b.lng) ? a : b);
            }
            //PEGA TODAS AS ENTREGAS QUE ESTÃO NO QUADRANTE DA ENTREGA MAIS PRÓXIMA
            var deliveriesToInsert = getDeliveriesFromQuadrantByDelivery(shortestDistanceToDeliver);
            var lengthDeliveriesToInsert = deliveriesToInsert.length;

            if (vehicle.deliveries.length + lengthDeliveriesToInsert <= vehicle.maxAWB) {
                deliveriesToInsert.forEach(delivery => {
                   vehicle.deliveries.push(delivery);
                   deliveriesInserted.push(delivery);
                });
            } 
            else 
            {

                for (let index = 0; index < lengthDeliveriesToInsert; index++) {
                    if (vehicle.deliveries.length < vehicle.maxAWB) {
                        var nearestDelivery;
                        if (index == 0) {
                            nearestDelivery = shortestDistanceToDeliver;
                            maxDistanceOnVehicle = shortestDistanceToDeliver;
                        } else {
                            //PEGA A ENTREGA MAIS PRÓXIMA                    
                            nearestDelivery = deliveriesToInsert.map(m => m).reduce((a, b) => getDistanceFromLatLonInKm(maxDistanceOnVehicle.lat, maxDistanceOnVehicle.lng, a.lat, a.lng) < getDistanceFromLatLonInKm(maxDistanceOnVehicle.lat, maxDistanceOnVehicle.lng, b.lat, b.lng) ? a : b);
                            maxDistanceOnVehicle = nearestDelivery;
                        }
                        vehicle.deliveries.push(nearestDelivery);
                        deliveriesInserted.push(nearestDelivery);

                        var indexOf = deliveriesToInsert.indexOf(nearestDelivery);
                        deliveriesToInsert.splice(indexOf, 1);
                    }
                }
            }


            deliveriesInserted.forEach(delivery => {
                var indexOf = this.quadrant.deliveries.indexOf(delivery);
                this.quadrant.deliveries.splice(indexOf, 1);
            });
        }

        calculateRoute(vehicle);
    });
}

function getDeliveriesFromQuadrantByDelivery(delivery) {
    for (let index = 0; index < this.quadrant.quadrants.length; index++) {
        const quadrant = this.quadrant.quadrants[index];

        for (let aux = 0; aux < quadrant.deliveries.length; aux++) {
            const deliveryItem = quadrant.deliveries[aux];
            if (deliveryItem.lat == delivery.lat && deliveryItem.lng == delivery.lng) {
                return quadrant.deliveries;
            }
        }
    }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function showAllDeliveriesOnQuadrants() {
    var divDeliveries = document.getElementById("deliveries");
    divDeliveries.innerHTML += "<h1>" + this.quadrant.deliveries.length + "</h1>";

    this.quadrant.quadrants.forEach((quadrant, i) => {
        var aux = i + 1;
        divDeliveries.innerHTML += "<h3>Quadrante " + aux + " - " + quadrant.deliveries.length + " Entregas</h3>";
        for (let index = 0; index < quadrant.deliveries.length; index++) {
            const element = quadrant.deliveries[index];
            divDeliveries.innerHTML += "<p>" + element.name + "</p>"
        }
    });
}

function calculateRoute(vehicle) {
    // Divide route to several parts because max stations limit is 25 (23 waypoints + 1 origin + 1 destination)
    for (var i = 0, parts = [], max = 25 - 1; i < vehicle.deliveries.length; i = i + max)
        parts.push(vehicle.deliveries.slice(i, i + max + 1));

    // Service callback to process service results
    var service_callback = function (response, status) {
        if (status != 'OK') {
            console.log('Directions request failed due to ' + status);
            return;
        }

        var timeExpend = 0;
        var km = 0;

        response.routes[0].legs.forEach(leg => {
            km += leg.distance.value;
            timeExpend += leg.duration.value;
        });

        divVehicles = document.getElementById("vehicles");
        divVehicles.innerHTML += "<h2>" + vehicle.description + "</h2>";
        divVehicles.innerHTML += "<h3> Quantidade de entregas:" + vehicle.deliveries.length + "</h3>";
        divVehicles.innerHTML += "<p> O veículo percorreu " + (km / 1000).toFixed(2) + " kms em aproximadamente " + secondsToHms(timeExpend);

        var renderer = new google.maps.DirectionsRenderer;
        renderer.setMap(map);
        renderer.setOptions({ suppressMarkers: true, preserveViewport: true, polylineOptions: { strokeColor: vehicle.color } });
        renderer.setDirections(response);
    };

    // Send requests to service to get route (for stations count <= 25 only one request will be sent)
    for (var i = 0; i < parts.length; i++) {
        // Waypoints does not include first station (origin) and last station (destination)
        var waypoints = [];
        var maxDistanceToDeliver = vehicle.deliveries.map(m => m).reduce((a, b) => getDistanceFromLatLonInKm(vehicle.lat, vehicle.lng, a.lat, a.lng) > getDistanceFromLatLonInKm(vehicle.lat, vehicle.lng, b.lat, b.lng) ? a : b);
        for (var j = 0; j < parts[i].length; j++) {
            if (parts[i][j] != maxDistanceToDeliver) {
                waypoints.push({ location: parts[i][j], stopover: true });
            }
        }
        // Service options
        var service_options = {
            origin: vehicle,
            destination: maxDistanceToDeliver,
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: 'DRIVING'
        };
        // Send request
        service.route(service_options, service_callback);
    }
}

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hora, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutos, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " segundos") : "";
    return hDisplay + mDisplay + sDisplay;
}

function setRectangle(bounds, color) {

    var rectangle = new google.maps.Rectangle({
        strokeWeight: 0,
        fillColor: color,
        fillOpacity: 0.35,
        map: map,
        bounds: bounds,
        _reference: color
    });

    rectangles.push(rectangle);
}

