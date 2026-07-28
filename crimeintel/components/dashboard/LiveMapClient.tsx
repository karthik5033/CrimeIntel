"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, GeoJSON, Polygon, LayerGroup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icon using an SVG Map Pin
const createCustomIcon = (isCritical: boolean, isSelected: boolean) => {
  const color = isCritical ? '#ef4444' : (isSelected ? '#3b82f6' : '#94a3b8');
  const size = isSelected ? 24 : 16;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2.5" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));"><circle cx="12" cy="12" r="9"/></svg>`;

  return L.divIcon({
    className: 'bg-transparent border-none outline-none',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

function MapCameraUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom() > 10 ? map.getZoom() : 11, {
      animate: true,
      duration: 1.5
    });
  }, [lat, lng, map]);
  return null;
}

// Generates realistic clustered scatter points for the heatmap
const generateCluster = (centerLat: number, centerLng: number, count: number, radiusInDegrees: number) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = radiusInDegrees * Math.pow(Math.random(), 2);
    const lat = centerLat + r * Math.cos(angle);
    const lng = centerLng + r * Math.sin(angle);
    points.push([lat, lng, Math.random() * 0.4]); 
  }
  return points;
};

function HeatmapLayer({ isVisible, mapStyle, hotspots }: { isVisible: boolean, mapStyle: string, hotspots: any[] }) {
  const map = useMap();
  
  const heatmapData = useMemo(() => {
    return hotspots.flatMap(spot => 
      generateCluster(spot.lat, spot.lng, spot.activeCases, 0.05)
    );
  }, [hotspots]);

  useEffect(() => {
    if (!isVisible) return;

    require('leaflet.heat');
    
    // @ts-ignore
    if (typeof L.heatLayer === 'function') {
      
      const isDark = mapStyle === 'dark' || mapStyle === 'satellite';
      
      // @ts-ignore
      const heat = L.heatLayer(heatmapData, {
        radius: 18,
        blur: 25,
        maxZoom: 13,
        minOpacity: 0.05,
        gradient: {
          0.3: '#fde047', // Yellow 300
          0.5: '#f59e0b', // Amber 500
          0.7: '#ea580c', // Orange 600
          0.9: '#ef4444', // Red 500
          1.0: '#7f1d1d'  // Red 900
        }
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [map, heatmapData, isVisible, mapStyle]);

  return null;
}

// Predictive Forecast Heatmap Layer
function PredictiveHeatmapLayer({ isVisible, mapStyle, hotspots }: { isVisible: boolean, mapStyle: string, hotspots: any[] }) {
  const map = useMap();
  
  const predictiveData = useMemo(() => {
    return hotspots.flatMap(spot => {
      const forecast = Math.round(spot.activeCases * 1.2);
      return generateCluster(spot.lat + 0.02, spot.lng + 0.02, forecast, 0.08);
    });
  }, [hotspots]);

  useEffect(() => {
    if (!isVisible) return;

    require('leaflet.heat');
    
    // @ts-ignore
    if (typeof L.heatLayer === 'function') {
      // @ts-ignore
      const heat = L.heatLayer(predictiveData, {
        radius: 20,
        blur: 30,
        maxZoom: 13,
        minOpacity: 0.1,
        gradient: {
          0.2: '#c084fc', // Purple 400
          0.5: '#a855f7', // Purple 500
          0.8: '#7e22ce', // Purple 700
          1.0: '#581c87'  // Purple 900
        }
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [map, predictiveData, isVisible, mapStyle]);

  return null;
}

// Generates a tactical "Pro" grid to simulate Ward Zones
function WardsGridLayer({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  const gridPolygons = [];
  const latStart = 12.83;
  const latEnd = 13.13;
  const lngStart = 77.45;
  const lngEnd = 77.75;
  const steps = 14; 
  
  for(let i=0; i<steps; i++) {
    for(let j=0; j<steps; j++) {
      const lat1 = latStart + (latEnd - latStart) * (i/steps);
      const lat2 = latStart + (latEnd - latStart) * ((i+1)/steps);
      const lng1 = lngStart + (lngEnd - lngStart) * (j/steps);
      const lng2 = lngStart + (lngEnd - lngStart) * ((j+1)/steps);
      
      const isActive = Math.random() > 0.85;
      const fillColor = isActive ? '#8b5cf6' : 'transparent';
      const fillOpacity = isActive ? Math.random() * 0.15 : 0;

      gridPolygons.push(
        <Polygon 
          key={`${i}-${j}`}
          positions={[[lat1, lng1], [lat1, lng2], [lat2, lng2], [lat2, lng1]]}
          pathOptions={{ 
            color: '#8b5cf6', 
            weight: 1, 
            opacity: 0.3,
            fillColor,
            fillOpacity,
            dashArray: '2, 4' 
          }}
        />
      );
    }
  }
  return <LayerGroup>{gridPolygons}</LayerGroup>;
}

export default function LiveMapClient({ hotspots, selectedSpot, onSelect, showHeatmap, showBoundaries, showWards, showPredictive, mapStyle }: any) {
  const defaultCenter: [number, number] = [12.9716, 77.5946]; 
  
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  useEffect(() => {
    fetch('/bangalore.json?t=' + (Date.now() + 3000))
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => {});
  }, []);

  const karnatakaBounds = L.latLngBounds([10.0, 72.0], [20.0, 80.0]);

  // Determine Tile URL based on selected Style Mode
  let tileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  if (mapStyle === 'dark') tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  if (mapStyle === 'satellite') tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="absolute inset-0 z-0 h-full w-full bg-slate-900">
      <MapContainer 
        center={defaultCenter} 
        zoom={10.5} 
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
        minZoom={4}
      >
        <TileLayer url={tileUrl} />
        
        {/* District Boundaries Layer */}
        {showBoundaries && geoJsonData && (
          <GeoJSON 
            key={geoJsonData.type}
            data={geoJsonData} 
            style={{
              color: mapStyle === 'light' ? '#2563eb' : '#0ea5e9', 
              weight: 3,
              opacity: 1.0,
              fillColor: mapStyle === 'light' ? '#3b82f6' : '#0ea5e9', 
              fillOpacity: 0.08
            }}
            // PROPER FIX: Prevents Leaflet from rendering broken marker images for Point features
            pointToLayer={(feature, latlng) => L.circleMarker(latlng, { radius: 0, opacity: 0, fillOpacity: 0 })}
          />
        )}

        <WardsGridLayer isVisible={showWards} />
        
        <HeatmapLayer isVisible={showHeatmap} mapStyle={mapStyle} hotspots={hotspots} />
      
        {/* Predictive layer - more spread out, different color tuning */}
        <PredictiveHeatmapLayer isVisible={showPredictive} mapStyle={mapStyle} hotspots={hotspots} />

        {selectedSpot && <MapCameraUpdater lat={selectedSpot.lat} lng={selectedSpot.lng} />}
      </MapContainer>
    </div>
  );
}
