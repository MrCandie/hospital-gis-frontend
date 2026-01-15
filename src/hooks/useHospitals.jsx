import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

export default function useHospital() {
  const [hospitals, setHospitals] = useState([]);
  const [userPosition, setUserPosition] = useState([6.5186991, 3.3974524]);
  const [nearestAmbulance, setNearestAmbulance] = useState(null);
  const ambulanceMarkerRef = useRef(null);

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
        const res = await axios.get(
          "https://hospital-gis-backend.onrender.com/api/v1/hospital"
        );
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
        `https://hospital-gis-backend.onrender.com/api/v1/hospital/${hospitalId}/find`,
        {}
      );
      const data = res.data?.data;

      if (data?.ambulance?.lat != null && data?.ambulance?.lng != null) {
        setNearestAmbulance(data.ambulance);
        toast.success(
          `Nearest hospital is ${data?.ambulance?.name} - ${(
            data?.ambulance?.distanceInMeters / 1000
          ).toFixed(2)} away`
        );
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
  return {
    handleHospitalClick,
    userPosition,
    hospitals,
    nearestAmbulance,
    ambulanceMarkerRef,
  };
}
