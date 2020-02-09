"use strict";
var Quadrant = /** @class */ (function () {
    function Quadrant() {
        this.deliveries = [];
        this.latMin = 0;
        this.latMax = 0;
        this.lngMin = 0;
        this.lngMax = 0;
        this.quadrants = [];
        this.sliceIn = 0;
    }
    Object.defineProperty(Quadrant.prototype, "latCenter", {
        get: function () {
            return (this.latMax + this.latMin) / 2;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Quadrant.prototype, "lngCenter", {    
        get: function () {
            return (this.lngMax + this.lngMin) / 2;
        },
        enumerable: true,
        configurable: true
    });
    Quadrant.prototype.calculateBounds = function () {
        this.latMax = this.deliveries.map(function (m) { return m.lat; }).reduce(function (a, b) { return a > b ? a : b; });
        this.latMin = this.deliveries.map(function (m) { return m.lat; }).reduce(function (a, b) { return a < b ? a : b; });
        this.lngMax = this.deliveries.map(function (m) { return m.lng; }).reduce(function (a, b) { return a > b ? a : b; });
        this.lngMin = this.deliveries.map(function (m) { return m.lng; }).reduce(function (a, b) { return a < b ? a : b; });
    };
    Quadrant.prototype.generateDivideCalculateBounds = function () {
        this.quadrants = new Array();
        for (var index = 1; index <= 4; index++) {
            var quadrant = new Quadrant();
            switch (index) {
                case 1:
                    quadrant.latMax = this.latMax;
                    quadrant.latMin = this.latCenter;
                    quadrant.lngMax = this.lngCenter;
                    quadrant.lngMin = this.lngMin;
                    break;
                case 2:
                    quadrant.latMax = this.latMax;
                    quadrant.latMin = this.latCenter;
                    quadrant.lngMax = this.lngMax;
                    quadrant.lngMin = this.lngCenter;
                    break;
                case 3:
                    quadrant.latMax = this.latCenter;
                    quadrant.latMin = this.latMin;
                    quadrant.lngMax = this.lngCenter;
                    quadrant.lngMin = this.lngMin;
                    break;
                case 4:
                    quadrant.latMax = this.latCenter;
                    quadrant.latMin = this.latMin;
                    quadrant.lngMax = this.lngMax;
                    quadrant.lngMin = this.lngCenter;
                    break;
            }
            var resultFilter = this.deliveries.filter(function (delivery) { return (delivery.lat <= quadrant.latMax && delivery.lat >= quadrant.latMin) && (delivery.lng <= quadrant.lngMax && delivery.lng >= quadrant.lngMin); });
            quadrant.deliveries = resultFilter;
            this.quadrants.push(quadrant);
        }
    };
    Quadrant.prototype.drawBounds = function () {
        var flightPlanCoordinates = [
            { lat: this.latMax, lng: this.lngMax },
            { lat: this.latMax, lng: this.lngMin },
            { lat: this.latMin, lng: this.lngMin },
            { lat: this.latMin, lng: this.lngMax },
            { lat: this.latMax, lng: this.lngMax }
        ];
        
        this.routingService.drawMarkers(flightPlanCoordinates);
    };
    
    return Quadrant;
}());