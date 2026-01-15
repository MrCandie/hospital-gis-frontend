import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import useHospital from "../hooks/useHospitals";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ambulanceIcon = new L.Icon({
  iconUrl: "/ambulance.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
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
  const {
    handleHospitalClick,
    userPosition,
    hospitals,
    nearestAmbulance,
    ambulanceMarkerRef,
  } = useHospital();

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
            icon={ambulanceIcon}
            ref={ambulanceMarkerRef}
          >
            <Popup>
              Nearest Ambulance:{" "}
              <strong className="capitalize">{nearestAmbulance.name}</strong>
              <br />
              Distance:{" "}
              <b>
                {Number(nearestAmbulance.distanceInMeters / 1000).toFixed(2)} KM
              </b>
            </Popup>
          </Marker>

          <PanTo position={[nearestAmbulance.lat, nearestAmbulance.lng]} />
        </>
      )}
    </MapContainer>
  );
}
