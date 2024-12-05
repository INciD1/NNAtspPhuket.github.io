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

window.generateRoute = function () {
    fetch("/generate")
        .then((response) => response.json())
        .then((locations) => {
            console.log("Locations:", locations);

            // Use NNA Algorithm to calculate the route
            const route = calculateNNARoute(locations);

            // Prepare waypoints for the directions API
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

            // Get the total distance and display route information
            directionsService.route(request, (result, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(result);

                    // Calculate total distance and build info string
                    const legs = result.routes[0].legs;
                    const totalDistance = legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000;

                    // Generate route info with distances
                    const routeInfo = legs.map((leg, index) => {
                        const locationName = route[index].name;
                        const distance = (leg.distance.value / 1000).toFixed(2);
                        const marker = String.fromCharCode(65 + index);
                        return `${marker} (${distance} กิโลเมตร) ${locationName}`;
                    }).join(" -> ");

                    // Update the info box
                    const infoBox = document.getElementById("info-box");
                    infoBox.innerHTML = `
                        <p><strong>เส้นทาง:</strong> ${routeInfo}</p>
                        <p><strong>ระยะทางรวม:</strong> ${totalDistance.toFixed(2)} กิโลเมตร</p>
                    `;
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

function updateTime() {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString();
    document.getElementById("currentTime").textContent = formattedTime;
}

const infoBox = document.getElementById('info-box');

let isDragging = false; // สถานะการลาก
let offsetX = 0;
let offsetY = 0;

// เรียกฟังก์ชันอัปเดตเวลาในทุกๆ 1 วินาที
setInterval(updateTime, 1000);

// เริ่มการลาก
infoBox.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - infoBox.offsetLeft;
    offsetY = e.clientY - infoBox.offsetTop;
    infoBox.classList.add('dragging'); // เพิ่มเอฟเฟกต์การลาก
});

// เคลื่อนที่ขณะลาก
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        infoBox.style.left = `${x}px`;
        infoBox.style.top = `${y}px`;
    }
});

// หยุดลาก
document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        infoBox.classList.remove('dragging'); // ลบเอฟเฟกต์การลาก
    }
});