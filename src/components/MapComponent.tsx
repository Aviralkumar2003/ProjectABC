import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import SearchBar from "./SearchBar";
import zonesData from "../data/zonesData";
import config from "../config/config";

const MapComponent = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [showZones, setShowZones] = useState<boolean>(false);

  useEffect(() => {
    mapboxgl.accessToken = config.mapboxAPI;

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [73.934982, 18.550985],
        zoom: 12,
      });
    }
  }, []);

  const handleSearch = (coords: [number, number], bbox?: [number, number, number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: coords,
        zoom: 12,
        essential: true,
      });

      if (bbox) {
        const boundaryPolygon = [
          [bbox[0], bbox[1]], // bottom-left
          [bbox[2], bbox[1]], // bottom-right
          [bbox[2], bbox[3]], // top-right
          [bbox[0], bbox[3]], // top-left
          [bbox[0], bbox[1]]  // Closing the loop
        ];

  
        if (mapRef.current.getLayer("boundary-layer")) {
          mapRef.current.removeLayer("boundary-layer");
          mapRef.current.removeSource("boundary");
        }

        
        mapRef.current.addSource("boundary", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [boundaryPolygon],
            },
          },
        });

        
        mapRef.current.addLayer({
          id: "boundary-layer",
          type: "line",
          source: "boundary",
          paint: {
            "line-color": "#FF0000",
            "line-width": 2,
            "line-dasharray": [2, 4],
          },
        });
      }
    }
  };

  const handleShowZones = () => {
    if (!mapRef.current) return;

    const currentState = showZones;
    setShowZones(!currentState);

    if (showZones) {
      zonesData.forEach((zone) => {
        if (mapRef.current && !mapRef.current.getSource(zone.id)) {
          mapRef.current.addSource(zone.id, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: zone.coordinates,
              },
            },
          });

          mapRef.current.addLayer({
            id: `${zone.id}-layer`,
            type: "fill",
            source: zone.id,
            paint: {
              "fill-color": "#007cbf",
              "fill-opacity": 0.4,
            },
          });
        }
      });
    } else {
      zonesData.forEach((zone) => {
        if (mapRef.current) {
          mapRef.current.removeLayer(`${zone.id}-layer`);
          mapRef.current.removeSource(zone.id);
        }
      });
    }
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <div className="h-screen flex items-center justify-center bg-gray-900 p-4">
        <div
          ref={mapContainerRef}
          className="h-[70vh] w-full max-w-4xl rounded-lg border border-gray-700 shadow-lg"
        />
      </div>

      <div className="flex justify-center my-4">
        <button
          onClick={handleShowZones}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Show Zones
        </button>
      </div>
    </div>
  );
};

export default MapComponent;
