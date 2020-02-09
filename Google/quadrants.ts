//class used to generate a division from vehicles informed in vehicles.json file.
class Quadrant {
    quadrants: Array<Quadrant>;
    deliveries: Array<IDelivery> = [];
    latMin: number = 0;
    latMax: number = 0;
    lngMin: number = 0;
    lngMax: number = 0;
    sliceIn: number;

    get latCenter(): number {
        return (this.latMax + this.latMin) / 2;
    }

    get lngCenter(): number {
        return (this.lngMax + this.lngMin) / 2;
    }

    constructor() {
        this.quadrants = [];
        this.sliceIn = 0;
    }

    public calculateBounds() {        
        this.latMax = this.deliveries.map(m => m.lat).reduce((a, b) => a > b ? a : b);
        this.latMin = this.deliveries.map(m => m.lat).reduce((a, b) => a < b ? a : b);
        this.lngMax = this.deliveries.map(m => m.lng).reduce((a, b) => a > b ? a : b);
        this.lngMin = this.deliveries.map(m => m.lng).reduce((a, b) => a < b ? a : b);
    }

    public generateDivideCalculateBounds() {
        this.quadrants = new Array<Quadrant>();

        for (let index = 1; index <= 4; index++) {
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

            var resultFilter = this.deliveries.filter(delivery => (delivery.lat <= quadrant.latMax && delivery.lat >= quadrant.latMin) && (delivery.lng <= quadrant.lngMax && delivery.lng >= quadrant.lngMin));
            quadrant.deliveries = resultFilter;
            this.quadrants.push(quadrant);
        }        
    }

    public drawBounds() {
        var flightPlanCoordinates = [
            { lat: this.latMax, lng: this.lngMax },
            { lat: this.latMax, lng: this.lngMin },
            { lat: this.latMin, lng: this.lngMin },
            { lat: this.latMin, lng: this.lngMax },
            { lat: this.latMax, lng: this.lngMax }
        ];

        var flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        flightPath.setMap(map);

        setMarker(new google.maps.LatLng(this.latMax, this.lngMax), "Ltd Max Lng Max" + this.latMax + " " + this.lngMax);
        setMarker(new google.maps.LatLng(this.latMax, this.lngMin), "Ltd Max Lng Min" + this.latMax + " " + this.lngMin);
        setMarker(new google.maps.LatLng(this.latMin, this.lngMax), "Ltd Min Lng Max" + this.latMin + " " + this.lngMax);
        setMarker(new google.maps.LatLng(this.latMin, this.lngMin), "Ltd Min Lng Min" + this.latMin + " " + this.lngMin);
        setMarker(new google.maps.LatLng(this.latCenter, this.lngCenter), "Ltd Center Lng Center" + this.latCenter + " " + this.lngCenter);

        this.quadrants.forEach(quadrant => {
            quadrant.drawBounds();
        });

        for (var i = 0; i < this.deliveries.length; i++) {
            var myLatLng = { lat: this.deliveries[i].lat, lng: this.deliveries[i].lng };

            var icon = {
                url: "https://cdn3.iconfinder.com/data/icons/geo-points/154/plus-point-location-geo-place-gps-map-512.png",
                //url: (i%2) == 0 ? "https://arte.estadao.com.br/politica/jair-bolsonaro/monitor-de-projetos/media/images/bolsonaro.png" : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScQmCaticaxKasm2REkLdWyVD8CRcmhztXHLoXrJh2_0E83YyAHg&s",
                scaledSize: new google.maps.Size(35,40)                
            }

            
            new google.maps.Marker({
                position: myLatLng,
                icon: icon,
                map: map,
                title: this.deliveries[i].name
            });
        }
    }


    public drawBoundsByQuadrand(quadrant: Quadrant) {
        var flightPlanCoordinates = [
            { lat: quadrant.latMax, lng: quadrant.lngMax },
            { lat: quadrant.latMax, lng: quadrant.lngMin },
            { lat: quadrant.latMin, lng: quadrant.lngMin },
            { lat: quadrant.latMin, lng: quadrant.lngMax },
            { lat: quadrant.latMax, lng: quadrant.lngMax }
        ];

        var flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        flightPath.setMap(map);

        setMarker(new google.maps.LatLng(quadrant.latMax, quadrant.lngMax), "Ltd Max Lng Max" + quadrant.latMax + " " + quadrant.lngMax);
        setMarker(new google.maps.LatLng(quadrant.latMax, quadrant.lngMin), "Ltd Max Lng Min" + quadrant.latMax + " " + quadrant.lngMin);
        setMarker(new google.maps.LatLng(quadrant.latMin, quadrant.lngMax), "Ltd Min Lng Max" + quadrant.latMin + " " + quadrant.lngMax);
        setMarker(new google.maps.LatLng(quadrant.latMin, quadrant.lngMin), "Ltd Min Lng Min" + quadrant.latMin + " " + quadrant.lngMin);
        setMarker(new google.maps.LatLng(quadrant.latCenter, quadrant.lngCenter), "Ltd Center Lng Center" + quadrant.latCenter + " " + quadrant.lngCenter);
    }

    public initMap() {
        // Zoom and center map automatically by stations (each station will be in visible map area)
        var lngs = this.deliveries.map(function (delivery) { return delivery.lng; });
        var lats = this.deliveries.map(function (delivery) { return delivery.lat; });
        map.fitBounds({
            west: Math.min.apply(null, lngs),
            east: Math.max.apply(null, lngs),
            north: Math.min.apply(null, lats),
            south: Math.max.apply(null, lats),
        });


        this.calculateBounds();
        this.generateDivideCalculateBounds();        
        this.drawBounds();
    }
}

interface IDelivery {
    lat: number;
    lng: number;
    name: string;
}

declare var map: any;
declare var google: any;

function setMarker(latLng: number, title: string) {
    var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: title,
        draggable: true
    });
}