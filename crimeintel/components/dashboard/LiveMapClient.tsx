"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, Circle, Polygon, LayerGroup, GeoJSON, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icon using an SVG Map Pin
const createCustomIcon = (threat: string, isSelected: boolean) => {
  const isCritical = threat === 'Critical';
  const color = isCritical ? '#ef4444' : (isSelected ? '#3b82f6' : '#64748b');
  const size = isSelected ? 12 : 8;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2.5" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));"><circle cx="12" cy="12" r="9"/></svg>`;

  return L.divIcon({
    className: 'bg-transparent border-none outline-none',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

// Custom marker icon for Police Stations
const createPSIcon = (mapStyle: string) => {
  const color = mapStyle === 'dark' ? '#0ea5e9' : '#1d4ed8'; // blue theme
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.4));"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  return L.divIcon({
    className: 'bg-transparent border-none outline-none',
    html: svg,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

function MapCameraUpdater({ lat, lng, isSelected }: { lat: number; lng: number, isSelected: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isSelected) {
      map.flyTo([lat, lng], 11, {
        animate: true,
        duration: 1.5
      });
    }
  }, [lat, lng, isSelected, map]);
  return null;
}

function HeatmapLayer({ isVisible, mapStyle, firPoints }: { isVisible: boolean, mapStyle: string, firPoints: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!isVisible || !firPoints || firPoints.length === 0) return;

    require('leaflet.heat');
    
    // @ts-ignore
    if (typeof L.heatLayer === 'function') {
      const heat = L.heatLayer(firPoints, {
        radius: 16,
        blur: 20,
        maxZoom: 13,
        minOpacity: 0.1,
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
  }, [map, firPoints, isVisible, mapStyle]);

  return null;
}

// Predictive Forecast Heatmap Layer
function PredictiveHeatmapLayer({ isVisible, mapStyle, recentSpikes }: { isVisible: boolean, mapStyle: string, recentSpikes: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!isVisible || !recentSpikes || recentSpikes.length === 0) return;

    require('leaflet.heat');
    
    // @ts-ignore
    if (typeof L.heatLayer === 'function') {
      // @ts-ignore
      const heat = L.heatLayer(recentSpikes, {
        radius: 20,
        blur: 25,
        maxZoom: 13,
        minOpacity: 0.15,
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
  }, [map, recentSpikes, isVisible, mapStyle]);

  return null;
}

// Generates a tactical "Pro" grid to simulate Ward Zones dynamically around the selected spot using real FIR intersection
function WardsGridLayer({ isVisible, selectedSpot, firPoints }: { isVisible: boolean, selectedSpot: any, firPoints: any[] }) {
  if (!isVisible || !selectedSpot || !firPoints) return null;

  const gridPolygons = [];
  const offset = 0.25; // Dynamic radius around selected spot
  const latStart = selectedSpot.lat - offset;
  const latEnd = selectedSpot.lat + offset;
  const lngStart = selectedSpot.lng - offset;
  const lngEnd = selectedSpot.lng + offset;
  const steps = 12; 
  
  for(let i=0; i<steps; i++) {
    for(let j=0; j<steps; j++) {
      const lat1 = latStart + (latEnd - latStart) * (i/steps);
      const lat2 = latStart + (latEnd - latStart) * ((i+1)/steps);
      const lng1 = lngStart + (lngEnd - lngStart) * (j/steps);
      const lng2 = lngStart + (lngEnd - lngStart) * ((j+1)/steps);
      
      // Real intersection: count how many FIR points fall in this grid cell
      let count = 0;
      for (const [flat, flng] of firPoints) {
        if (flat >= lat1 && flat < lat2 && flng >= lng1 && flng < lng2) {
          count++;
        }
      }

      // Only draw if there are active cases
      if (count > 0) {
        // Base opacity on count (e.g. 1 point = 0.1, 5+ points = 0.5 max)
        const fillOpacity = Math.min(count * 0.1, 0.5);
        
        gridPolygons.push(
          <Polygon 
            key={`${i}-${j}`}
            positions={[[lat1, lng1], [lat1, lng2], [lat2, lng2], [lat2, lng1]]}
            pathOptions={{ 
              color: '#8b5cf6', 
              weight: 1, 
              opacity: 0.5,
              fillColor: '#8b5cf6',
              fillOpacity,
              dashArray: '4, 4' 
            }}
          />
        );
      }
    }
  }
  return <LayerGroup>{gridPolygons}</LayerGroup>;
}

export default function LiveMapClient({ hotspots, firPoints, recentSpikes, policeStations, selectedSpot, onSelect, showHeatmap, showBoundaries, showWards, showPredictive, showPoliceStations, mapStyle }: any) {
  // Center of Karnataka State
  const defaultCenter: [number, number] = [15.3173, 75.7139]; 
  const defaultZoom = 7;

  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  useEffect(() => {
    fetch('/karnataka_smoothed.json')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error("Failed to load geojson", err));
  }, []);

  // Determine Tile URL based on selected Style Mode
  let tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
  if (mapStyle === 'dark') tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
  if (mapStyle === 'satellite') tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="absolute inset-0 z-0 h-full w-full bg-slate-900">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
        minZoom={5}
      >
        <TileLayer 
          url={tileUrl} 
          maxNativeZoom={16}
          maxZoom={19}
        />
        
        {/* District Boundaries Layer (Real Karnataka GeoJSON) */}
        {showBoundaries && geoJsonData && (
          <GeoJSON 
            key={geoJsonData.type}
            data={geoJsonData} 
            style={{
              color: mapStyle === 'light' ? '#2563eb' : '#0ea5e9', 
              weight: 1.5,
              opacity: 0.6,
              fillColor: mapStyle === 'light' ? '#3b82f6' : '#0ea5e9', 
              fillOpacity: 0.05,
              dashArray: '4, 4',
              lineJoin: 'round',
              lineCap: 'round'
            }}
            pointToLayer={(feature, latlng) => L.circleMarker(latlng, { radius: 0, opacity: 0, fillOpacity: 0 })}
            onEachFeature={(feature, layer) => {
              if (feature.properties && feature.properties.district) {
                layer.bindTooltip(feature.properties.district, { direction: 'center', className: 'text-xs font-bold bg-white/90 border-none shadow-sm rounded px-2 py-1' });
              }
            }}
          />
        )}

        {/* Dynamic Wards Grid around active selection */}
        <WardsGridLayer isVisible={showWards} selectedSpot={selectedSpot} firPoints={firPoints} />
        
        {/* Intensity Heatmap */}
        <HeatmapLayer isVisible={showHeatmap} mapStyle={mapStyle} firPoints={firPoints} />
      
        {/* Predictive 7-Day Forecast */}
        <PredictiveHeatmapLayer isVisible={showPredictive} mapStyle={mapStyle} recentSpikes={recentSpikes} />

        {/* Hotspot Markers (Police Stations) */}
        {showPoliceStations && hotspots.map((spot: any) => {
          const isSelected = selectedSpot?.id === spot.id;
          return (
            <Marker 
              key={spot.id} 
              position={[spot.lat, spot.lng]}
              icon={createCustomIcon(spot.threat, isSelected)}
              eventHandlers={{
                click: () => onSelect(spot)
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} className="font-bold text-xs">
                {spot.name}
              </Tooltip>
            </Marker>
          );
        })}



        {selectedSpot && <MapCameraUpdater lat={selectedSpot.lat} lng={selectedSpot.lng} isSelected={true} />}
      </MapContainer>
    </div>
  );
}
