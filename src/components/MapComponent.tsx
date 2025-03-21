import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import SearchBar from "./SearchBar";
import zonesData from "../data/zonesData";
import config from "../config/config";
import { ZoneFillColour, ZoneOutlineColour } from "../enums/enums";

const MapComponent = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [showZones, setShowZones] = useState<boolean>(true);

  useEffect(() => {
    mapboxgl.accessToken = config.mapboxAPI;

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [73.934982, 18.550985],
        zoom: 12,
      });

      mapRef.current.on("load", () => {
        renderZones();
      });
    }
  }, []);

  const handleSearch = (centerCoordinates: [number, number],polygonCoordinates?: [number, number, number, number]) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: centerCoordinates,
        zoom: 12,
        essential: true,
      });

      if (polygonCoordinates) {
        const boundaryPolygon = [
          [polygonCoordinates[0], polygonCoordinates[1]], // bottom-left
          [polygonCoordinates[2], polygonCoordinates[1]], // bottom-right
          [polygonCoordinates[2], polygonCoordinates[3]], // top-right
          [polygonCoordinates[0], polygonCoordinates[3]], // top-left
          [polygonCoordinates[0], polygonCoordinates[1]], // Closing the loop
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

  const renderZones = () => {
    if (!mapRef.current) return;

    const globalZone = zonesData.find((zone) => zone.id === "global-zone");
    if (globalZone && !mapRef.current.getSource(globalZone.id)) {
      mapRef.current.addSource(globalZone.id, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: globalZone.coordinates,
          },
        },
      });

      mapRef.current.addLayer({
        id: `${globalZone.id}-layer`,
        type: "fill",
        source: globalZone.id,
        paint: {
          "fill-color": ZoneFillColour.PERMITTED,
          "fill-outline-color": ZoneOutlineColour.PERMITTED,
          "fill-opacity": 0.2,
        },
      });
    }

    zonesData.forEach((zone) => {
      if (zone.id === "global-zone") return;
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

        const fillColor =ZoneFillColour[zone.type.toUpperCase() as keyof typeof ZoneFillColour];
        const outlineColor =ZoneOutlineColour[zone.type.toUpperCase() as keyof typeof ZoneOutlineColour];

        mapRef.current.addLayer({
          id: `${zone.id}-layer`,
          type: "fill",
          source: zone.id,
          paint: {
            "fill-color": fillColor,
            "fill-outline-color": outlineColor,
            "fill-opacity": 0.5,
          },
        });
      }
    });
  };

  const removeZones = () => {
    if (!mapRef.current) return;

    zonesData.forEach((zone) => {
      if (mapRef.current?.getLayer(`${zone.id}-layer`)) {
        mapRef.current.removeLayer(`${zone.id}-layer`);
      }
      if (mapRef.current?.getSource(zone.id)) {
        mapRef.current.removeSource(zone.id);
      }
    });
  };

  const handleShowZones = () => {
    if (!mapRef.current) return;

    setShowZones((prev) => {
      if (prev) {
        removeZones();
      } else {
        renderZones();
      }
      return !prev;
    });
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
          {showZones ? "Hide Zones" : "Show Zones"}
        </button>
      </div>
    </div>
  );
};

export default MapComponent;
