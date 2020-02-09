var MAX_ROUTING_INPUTS = 25;
var map = tt.map({
    key: 'YOUR_TOMTOM_KEY',
    container: 'map',
    center: [-47.808163,-21.165566],
    zoom: 12,
    style: 'tomtom://vector/1/basic-main',
    dragPan: !window.isMobileOrTablet()
});
map.addControl(new tt.FullscreenControl());
map.addControl(new tt.NavigationControl());
new Foldable('#foldable', 'top-right');
var routingInputs = [];
var route;
var markers = [];
var infoHint = new InfoHint('error', 'bottom-center', 5000).addTo(document.getElementById('map'));
var loadingHint = new InfoHint('info', 'bottom-center').addTo(document.getElementById('map'));
var vehicles = [];
var quadrant = new Quadrant();

function RoutingService() { }

function initMap() {

    $.ajax({
        url: '../documents.json',
        dataType: 'json',
        async: false,
        success: function (json) {
            quadrant.deliveries = json.documents; 
            quadrant.calculateBounds();    
            quadrant.generateDivideCalculateBounds();
        }
    });

    $.ajax({
        url: '../vehicles.json',
        dataType: 'json',
        async: false,
        success: function (json) {
            vehicles = json.vehicles;
        }
    });

    showAllDeliveriesOnQuadrants();

    // Show stations on the map as markers
    var allVehiclesLocations = [];

    for (var i = 0; i < vehicles.length; i++) {
        var myLatLng = { lat: vehicles[i].lat, lng: vehicles[i].lng };
        
       allVehiclesLocations.push(myLatLng);
    }

    this.routingService.drawMarkers(allVehiclesLocations);
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

        this.routingService.calculateRoute(vehicle);
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


RoutingService.prototype.calculateRoute = function (vehicle) {    
   
    var locations = this.getLocations(vehicle);
    this.drawMarkers(locations.arr);
    if (locations.count < 2) {
        return;
    }
    loadingHint.setMessage('Loading...');
    tt.services.calculateRoute({
        key: 'YOUR_TOMTOM_KEY',
        options:{
            key:'YOUR_TOMTOM_KEY',
            alternativeType: 2,
            computeBestOrder: true
        },
        traffic: false,
        locations: locations.str
    })
        .go()
        .then(function (response) {
            loadingHint.hide();
            this.clearMarkers();
            var geojson = response.toGeoJson();
            route = map.addLayer({
                'id': 'route' + vehicle.description,
                'type': 'line',
                'source': {
                    'type': 'geojson',
                    'data': geojson
                },
                'paint': {
                    'line-color': vehicle.color,
                    'line-width': 6
                }
            }, this.findFirstBuildingLayerId());

            this.drawMarkers(locations.arr);
        }.bind(this))
        .catch(function (err) {
            loadingHint.hide();
            infoHint.setMessage(err.data.error.description);
        });
};

RoutingService.prototype.clearMarkers = function () {
    markers.forEach(function (marker) {
        marker.remove();
    });
};

RoutingService.prototype.drawMarkers = function (locations) {
    var bounds = new tt.LngLatBounds();
    var maxIndex = locations.length - 1;
    if (maxIndex < 0) {
        return;
    }

    locations.forEach(function (location, index) {
        var marker = new tt.Marker(this.waypointMarker(index, maxIndex)).setLngLat(location).addTo(map);
        markers.push(marker);
        bounds.extend(tt.LngLat.convert(location));
    }, this);
    map.fitBounds(bounds, { duration: 0, padding: 100 });
};

RoutingService.prototype.findFirstBuildingLayerId = function () {
    var layers = map.getStyle().layers;
    for (var index in layers) {
        if (layers[index].type === 'fill-extrusion') {
            return layers[index].id;
        }
    }

    throw new Error('Map style does not contain any layer with fill-extrusion type.');
};

RoutingService.prototype.getLocations = function (vehicle) {
    var resultStr = '';
    var resultArr = [];    
    var count = 0;
    if(vehicle){

    count++;
    resultArr.push(vehicle);
    resultStr += vehicle.lng + ',' + vehicle.lat + ':';

    vehicle.deliveries.forEach(function (delivery) {
            count++;
            resultArr.push(delivery);
            resultStr += delivery.lng + ',' + delivery.lat + ':';
        
    });
}
    resultStr = resultStr.substring(0, resultStr.length - 1);
    return {
        str: resultStr,
        count: count,
        arr: resultArr
    };
};

RoutingService.prototype.waypointMarker = function (index, total) {
    var container = document.createElement('div');
    container.className = 'waypoint-marker';
    if (index === 0) {
        container.className += ' tt-icon -start -white';
    } else if (index === total) {
        container.className += ' tt-icon -finish -white';
    } else {
        var number = document.createElement('div');
        number.innerText = index;
        container.appendChild(number);
    }
    return container;
};

function RoutingInput(options) {
    this.index = options.index;
    this.routingService = options.routingService;
    this.onRemoveBtnClick = options.onRemove.bind(this);
    this.container = this.createContainer();
    this.searchBox = this.createSearchBox();
    this.icon = this.createIconContainer();
    this.removeButton = this.createRemoveButton();
    this.container.appendChild(this.icon);
    this.container.appendChild(this.searchBox);
    this.container.appendChild(this.searchBox);
    this.container.appendChild(this.removeButton);
}

RoutingInput.prototype.createContainer = function () {
    var container = document.createElement('div');
    container.className = 'route-input-container';
    return container;
};

RoutingInput.prototype.createSearchBox = function () {
    var searchBox = new tt.plugins.SearchBox(tt.services.fuzzySearch, {
        showSearchIcon: false,
        searchOptions: {
            key: 'YOUR_TOMTOM_KEY'
        },
        placeholder: 'Search for a place...'
    });
    var htmlSearchBox = searchBox.getSearchBoxHTML();
    document.getElementById('searchBoxesPlaceholder').appendChild(htmlSearchBox);
    searchBox.on('tomtom.searchbox.resultselected', this.onResultSelected.bind(this));
    searchBox.on('tomtom.searchbox.resultscleared', this.onResultCleared.bind(this));
    return htmlSearchBox;
};

RoutingInput.prototype.getIconType = function () {
    var lastIdx = routingInputs.length - 1;
    switch (this.index) {
        case 0:
            return 'start';
        case lastIdx:
            return 'finish';
        default:
            return 'number';
    }
};

RoutingInput.prototype.getIconClassName = function (iconType) {
    switch (iconType) {
        case 'start':
            return 'tt-icon tt-icon-size icon-spacing-right -start -black';
        case 'finish':
            return 'tt-icon tt-icon-size icon-spacing-right -finish -black';
        case 'number':
            return 'tt-icon-number icon-spacing-right icon-number';
    }
};

RoutingInput.prototype.createRemoveButton = function () {
    var button = document.createElement('button');
    button.className = 'tt-icon icon-spacing-left remove-btn -trash -black';
    button.onclick = function (event) {
        event.preventDefault();
        this.container.parentNode.removeChild(this.container);
        routingInputs.splice(this.index, 1);
        this.onRemoveBtnClick();
    }.bind(this);
    return button;
};

RoutingInput.prototype.createIconContainer = function () {
    var icon = document.createElement('div');
    return icon;
};

RoutingInput.prototype.updateIcons = function () {
    var icon = document.createElement('div');
    var iconType = this.getIconType();
    icon.className = this.getIconClassName(iconType);

    if (iconType === 'number') {
        var number = document.createElement('div');
        number.innerText = this.index;
        icon.appendChild(number);
    }

    this.container.replaceChild(icon, this.icon);
    this.icon = icon;
    if (routingInputs.length <= 2) {
        this.removeButton.classList.add('hidden');
    } else {
        this.removeButton.classList.remove('hidden');
    }
};

RoutingInput.prototype.onResultCleared = function () {
    this.position = undefined;
    this.routingService.calculateRoute();
};

RoutingInput.prototype.onResultSelected = function (result) {
    this.position = result.data.result.position;
    this.routingService.calculateRoute();
};

function Panel(routingService) {
    this.routingService = routingService;
    this.container = document.getElementById('form');
    this.createInput();
    this.createInput();
    this.createAddButton();
}

Panel.prototype.createWaypoint = function () {
    var length = routingInputs.length;
    if (length === MAX_ROUTING_INPUTS) {
        infoHint.setMessage('You cannot add more waypoints in this example, but ' +
            'the Routing service supports up to 150 waypoints.');
        return;
    }
    var index = length - 1;
    var routingInput = this.createRoutingInput(index);
    this.container.insertBefore(routingInput.container, routingInputs[length - 1].container);
    routingInputs.splice(index, 0, routingInput);
    this.updateRoutingInputIndexes();
    this.updateRoutingInputIcons();
};

Panel.prototype.createRoutingInput = function (index) {
    return new RoutingInput({
        index: index,
        onRemove: this.onRemoveBtnClick.bind(this),
        routingService: this.routingService
    });
};

Panel.prototype.createInput = function () {
    var index = routingInputs.length;
    var routingInput = this.createRoutingInput(index);
    this.container.appendChild(routingInput.container);
    routingInputs.push(routingInput);
    routingInput.updateIcons();
};

Panel.prototype.createAddButton = function () {
    var button = document.createElement('button');
    button.appendChild(document.createTextNode('Adicionar Ponto'));
    button.className = 'tt-button -primary add-stop-btn';
    button.onclick = function (event) {
        event.preventDefault();
        this.createWaypoint();
    }.bind(this);

    this.container.appendChild(button);
};

Panel.prototype.onRemoveBtnClick = function () {
    this.updateRoutingInputIndexes();
    this.updateRoutingInputIcons();
    this.routingService.calculateRoute();
};

Panel.prototype.updateRoutingInputIndexes = function () {
    routingInputs.forEach(function (routingInput, index) {
        routingInput.index = index;
    });
};

Panel.prototype.updateRoutingInputIcons = function () {
    routingInputs.forEach(function (routingInput) {
        routingInput.updateIcons();
    });
};

var routingService = new RoutingService();
map.on('load', function () {
    routingService.calculateRoute();
});

new Panel(routingService);