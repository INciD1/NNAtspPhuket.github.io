let map, directionsService, directionsRenderer;

// ฟังก์ชันสำหรับเริ่มต้น Google Maps
window.initMap = function () {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 7.8804, lng: 98.3923 },
        zoom: 13,
    });

    // เพิ่ม Traffic Layer
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    // กำหนด Directions Service และ Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
};

// ฟังก์ชันสำหรับสร้างเส้นทาง
window.generateRoute = function () {
    fetch("/generate")
        .then((response) => response.json())
        .then((locations) => {
            console.log("Locations:", locations);

            // ใช้ NNA Algorithm สำหรับการคำนวณเส้นทาง
            const route = calculateNNARoute(locations);

            const waypoints = route.slice(1, -1).map((location) => ({
                location: { lat: location.lat, lng: location.lng },
                stopover: true,
            }));

            const request = {
                origin: { lat: route[0].lat, lng: route[0].lng },
                destination: { lat: route[route.length - 1].lat, lng: route[route.length - 1].lng },
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
            };

            directionsService.route(request, (result, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(result);
                } else {
                    console.error("Error generating route:", status);
                }
            });
        })
        .catch((error) => console.error("Error fetching locations:", error));
};

// ตัวอย่าง NNA Algorithm
function calculateNNARoute(locations) {
    // เริ่มต้นด้วยตำแหน่งแรก
    const route = [locations[0]];
    const remaining = locations.slice(1);

    while (remaining.length) {
        const last = route[route.length - 1];
        const nearest = remaining.reduce((a, b) =>
            distance(last, a) < distance(last, b) ? a : b
        );
        route.push(nearest);
        remaining.splice(remaining.indexOf(nearest), 1);
    }
    return route;
}

// ฟังก์ชันสำหรับคำนวณระยะทาง
function distance(loc1, loc2) {
    const dx = loc1.lat - loc2.lat;
    const dy = loc1.lng - loc2.lng;
    return Math.sqrt(dx * dx + dy * dy);
}
