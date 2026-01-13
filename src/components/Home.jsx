import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function PanTo({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position && position[0] != null && position[1] != null) {
      map.flyTo(position, 15, { duration: 1.5 });
    }
  }, [position, map]);

  return null;
}

export default function Home() {
  const [hospitals, setHospitals] = useState([]);
  const [userPosition, setUserPosition] = useState([6.5186991, 3.3974524]);
  const [nearestAmbulance, setNearestAmbulance] = useState(null);
  const ambulanceMarkerRef = useRef(null); // ✅ Marker ref

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        { enableHighAccuracy: true }
      );
    }

    const fetchHospitals = async () => {
      try {
        const res = await axios.get("http://localhost:8080/api/v1/hospital");
        const data = res.data?.data || [];
        setHospitals(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHospitals();
  }, []);

  const handleHospitalClick = async (hospitalId) => {
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/hospital/${hospitalId}/find`,
        {}
      );
      const data = res.data?.data;

      if (data?.ambulance?.lat != null && data?.ambulance?.lng != null) {
        setNearestAmbulance(data.ambulance);
      } else {
        console.warn("Ambulance data missing lat/lng");
      }
    } catch (err) {
      console.error("Error fetching nearest ambulance:", err);
      alert("Failed to fetch nearest ambulance");
    }
  };

  useEffect(() => {
    if (nearestAmbulance && ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.openPopup();
    }
  }, [nearestAmbulance]);

  return (
    <MapContainer
      center={userPosition}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <Marker position={userPosition}>
        <Popup>You are here</Popup>
      </Marker>

      {hospitals.map((hospital) => (
        <Marker
          key={hospital.id}
          position={[hospital.lat, hospital.lng]}
          eventHandlers={{
            click: () => handleHospitalClick(hospital.id),
          }}
        >
          <Popup>
            <strong>{hospital.name}</strong>
            <br />
            ID: {hospital.id}
          </Popup>
        </Marker>
      ))}

      {nearestAmbulance && (
        <>
          <Marker
            position={[nearestAmbulance.lat, nearestAmbulance.lng]}
            icon={new L.Icon({ iconUrl: markerIcon, iconSize: [25, 41] })}
            ref={ambulanceMarkerRef}
          >
            <Popup>
              Nearest Ambulance:{" "}
              <strong className="capitalize">{nearestAmbulance.name}</strong>
              <br />
              Distance:{" "}
              <b>{Number(nearestAmbulance.distanceInMeters) / 1000} KM</b>
            </Popup>
          </Marker>

          <PanTo position={[nearestAmbulance.lat, nearestAmbulance.lng]} />
        </>
      )}
    </MapContainer>
  );
}
