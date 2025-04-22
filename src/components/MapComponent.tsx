import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import SearchBar from "./SearchBar";
import zonesData from "../data/zonesData";
import config from "../config/config";
import { ZoneFillColour, ZoneOutlineColour } from "../enums/enums";
import droneMarker from "../assets/droneMarker";

const MapComponent = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [layerIds, setLayerIds] = useState<string[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showZones, setShowZones] = useState(true);

  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([73.934982, 18.550985]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = config.mapboxAPI;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [73.934982, 18.550985],
      zoom: 12,
    });

    mapRef.current.on("load", () => {
      setMapLoaded(true);
      renderZones();
      addDraggableMarker(markerPosition);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);
  

  useEffect(() => {
    if (!mapLoaded) return;
    layerIds.forEach((layerId) => {
      const visibility = showZones ? "visible" : "none";
      mapRef.current?.setLayoutProperty(`${layerId}-layer`, "visibility", visibility);
    });
  }, [mapLoaded, showZones]);

  const renderZones = () => {
    if (!mapRef.current) return;
  
    const newLayerIds: string[] = [];
  
    zonesData.forEach((zone) => {
      if (!mapRef.current!.getSource(zone.id)) {
        newLayerIds.push(zone.id);
  
        mapRef.current!.addSource(zone.id, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: { id: zone.id, type: zone.type },
            geometry: {
              type: "Polygon",
              coordinates: zone.coordinates,
            },
          },
        });
  
        mapRef.current!.addLayer({
          id: `${zone.id}-layer`,
          type: "fill",
          source: zone.id,
          layout: { visibility: "visible" },
          paint: {
            "fill-color": ZoneFillColour[zone.type.toUpperCase() as keyof typeof ZoneFillColour],
            "fill-outline-color": ZoneOutlineColour[zone.type.toUpperCase() as keyof typeof ZoneOutlineColour],
            "fill-opacity": 0.5,
          },
        });
      }
    });

    setLayerIds((prevLayerIds) => [...prevLayerIds, ...newLayerIds]);
  };
  

  const handleSearch = (centerCoordinates: [number, number], polygonCoordinates?: [number, number, number, number]) => {
    if (!mapRef.current) return;

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
  };

  const addDraggableMarker = (initialPosition: [number, number]) => {
    if (!mapRef.current) return;

    const newMarker = new mapboxgl.Marker(droneMarker(),{ draggable: true })
      .setLngLat(initialPosition)
      .addTo(mapRef.current);

    newMarker.on("drag", () => {
      const lngLat = newMarker.getLngLat();
      setMarkerPosition([lngLat.lng, lngLat.lat]);
      checkZone(lngLat.lng, lngLat.lat);
    });

    setMarker(newMarker);
  };


  const checkZone = (lng: number, lat: number) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const allLayers = map.getStyle()?.layers || [];
  
    const zoneLayerIds = allLayers
      .filter(layer => layer.id.endsWith("-layer"))
      .map(layer => layer.id);
  
    if (zoneLayerIds.length > 0) {
      const features = map.queryRenderedFeatures(map.project([lng, lat]), {
        layers: zoneLayerIds,
      });
  
      if (features.length > 0) {
        const zone = features[0].properties;
        console.log("Current Location:", { longitude: lng, latitude: lat }, " Zone Id:", zone?.id, "Zone Type:", zone?.type);
      } else {
        console.log("Current Location:", { longitude: lng, latitude: lat });
        console.log("Not inside any zone");
      }
    } else {
      console.log("Current Location:", { longitude: lng, latitude: lat });
    }
  };
  

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <div className="h-screen flex items-center justify-center bg-gray-900 p-4">
        <div ref={mapContainerRef} className="h-[70vh] w-full max-w-4xl rounded-lg border border-gray-700 shadow-lg" />
      </div>

      <div className="flex justify-center my-4">
        <button onClick={() => setShowZones(!showZones)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          {showZones ? "Hide Zones" : "Show Zones"}
        </button>
      </div>
    </div>
  );
};

export default MapComponent;