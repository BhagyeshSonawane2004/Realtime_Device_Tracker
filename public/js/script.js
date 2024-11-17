const socket = io();

// Check for Geolocation API support
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Fetched location: Latitude = ${latitude}, Longitude = ${longitude}`);
            // Emit location data to the server
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error("Geolocation error:", error.message);
        },
        {
            enableHighAccuracy: true, // Make sure the highest accuracy is used
            timeout: 10000,             // Timeout for retrieving location
            maximumAge: 0,             // Do not use cached data
        }
    );
} else {
    console.error("Geolocation is not supported by this browser.");
}

// Initialize the map with default coordinates
const map = L.map("map").setView([0, 0], 2); // Default view at zoom level 2

// Add a tile layer for the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data © OpenStreetMap contributors",
}).addTo(map);

// Store markers by user ID
const markers = {};

// Listen for location updates from the server
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    console.log(`Received location from ${id}: Latitude = ${latitude}, Longitude = ${longitude}`);

    if (markers[id]) {
        // Update the existing marker's position
        markers[id].setLatLng([latitude, longitude]);
    } else {
        // Create a new marker if it doesn't exist
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    // Re-center the map to the last received location
    map.setView([latitude, longitude], 16);
});

// Remove markers when a user disconnects
socket.on("user-disconnected", (id) => {
    console.log(`User disconnected: ${id}`);
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
