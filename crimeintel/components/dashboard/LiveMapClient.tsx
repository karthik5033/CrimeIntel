"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, Circle, Polygon, LayerGroup, GeoJSON, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icon using an SVG Map Pin
const createCustomIcon = (threat: string, isSelected: boolean) => {
  const isCritical = threat === 'Critical';
  const color = isCritical ? '#ef4444' : (isSelected ? '#3b82f6' : '#64748b');
  const size = isSelected ? 6 : 4;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3));"><circle cx="12" cy="12" r="6"/></svg>`;

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

// BBMP Ward Boundaries Layer - Loads actual 198 ward boundaries for Bengaluru
function BBMPWardsLayer({ isVisible, mapStyle }: { isVisible: boolean, mapStyle: string }) {
  const [wardGeoJson, setWardGeoJson] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      fetch('/bbmp_wards_sample.json')
        .then(res => res.json())
        .then(data => setWardGeoJson(data))
        .catch(err => console.error("Failed to load BBMP wards", err));
    }
  }, [isVisible]);

  if (!isVisible || !wardGeoJson) return null;

  return (
    <GeoJSON 
      key="bbmp-wards"
      data={wardGeoJson} 
      style={{
        color: '#8b5cf6', // Purple to match UI toggle color
        weight: 1.5,
        opacity: 0.8,
        fillColor: '#8b5cf6',
        fillOpacity: 0.15,
        lineJoin: 'round',
        lineCap: 'round'
      }}
      onEachFeature={(feature, layer) => {
        if (feature.properties && feature.properties.ward_no) {
          const wardInfo = `Ward ${feature.properties.ward_no} - ${feature.properties.zone}`;
          layer.bindTooltip(wardInfo, { 
            direction: 'center', 
            className: 'text-xs font-semibold bg-purple-50 dark:bg-purple-900/90 border border-purple-300 dark:border-purple-700 shadow-sm rounded px-2 py-1' 
          });
        }
      }}
    />
  );
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
              weight: 0.5,
              opacity: 0.6,
              fillColor: mapStyle === 'light' ? '#3b82f6' : '#0ea5e9', 
              fillOpacity: 0.05,
              dashArray: '',
              lineJoin: 'round',
              lineCap: 'round',
              smoothFactor: 2.5
            }}
            pointToLayer={(feature, latlng) => null as any}
            onEachFeature={(feature, layer) => {
              if (feature.properties && feature.properties.district) {
                layer.bindTooltip(feature.properties.district, { direction: 'center', className: 'text-xs font-bold bg-white/90 border-none shadow-sm rounded px-2 py-1' });
              }
            }}
          />
        )}

        {/* BBMP Ward Boundaries (198 wards across 8 zones) */}
        <BBMPWardsLayer isVisible={showWards} mapStyle={mapStyle} />
        
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
