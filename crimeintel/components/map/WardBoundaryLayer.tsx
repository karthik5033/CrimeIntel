/**
 * BBMP Ward Boundary Layer Component
 * 
 * Displays all 198 BBMP wards on the map with interactive features.
 * 
 * Usage:
 *   import WardBoundaryLayer from '@/components/map/WardBoundaryLayer';
 *   
 *   <Map>
 *     <WardBoundaryLayer />
 *   </Map>
 */

'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-map-gl';

// Import the sample ward data (replace with official data when available)
import bbmpWardsData from '@/public/bbmp_wards_sample.json';

interface WardBoundaryLayerProps {
  visible?: boolean;
  onWardClick?: (wardNo: number, wardName: string) => void;
  highlightedWard?: number | null;
  showLabels?: boolean;
}

export default function WardBoundaryLayer({
  visible = true,
  onWardClick,
  highlightedWard = null,
  showLabels = true
}: WardBoundaryLayerProps) {
  const { current: map } = useMap();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!map) return;
    
    // Wait for map to be loaded
    if (!map.isStyleLoaded()) {
      map.once('load', () => setIsLoaded(true));
      return;
    }
    
    setIsLoaded(true);
  }, [map]);
  
  useEffect(() => {
    if (!map || !isLoaded) return;
    
    const sourceId = 'bbmp-wards';
    const fillLayerId = 'ward-fill';
    const outlineLayerId = 'ward-outline';
    const labelsLayerId = 'ward-labels';
    
    // Add source if it doesn't exist
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: bbmpWardsData as any
      });
    }
    
    // Add fill layer if it doesn't exist
    if (!map.getLayer(fillLayerId)) {
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'ward_no'], highlightedWard ?? -1],
            '#FF6B6B',  // Highlighted ward - red
            '#4A90E2'   // Default ward - blue
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'ward_no'], highlightedWard ?? -1],
            0.5,  // Highlighted ward opacity
            0.2   // Default opacity
          ]
        },
        layout: {
          visibility: visible ? 'visible' : 'none'
        }
      });
    }
    
    // Add outline layer
    if (!map.getLayer(outlineLayerId)) {
      map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'ward_no'], highlightedWard ?? -1],
            '#DC2626',  // Highlighted ward border - dark red
            '#2563EB'   // Default border - dark blue
          ],
          'line-width': [
            'case',
            ['==', ['get', 'ward_no'], highlightedWard ?? -1],
            3,  // Highlighted border width
            1   // Default border width
          ]
        },
        layout: {
          visibility: visible ? 'visible' : 'none'
        }
      });
    }
    
    // Add labels layer
    if (showLabels && !map.getLayer(labelsLayerId)) {
      map.addLayer({
        id: labelsLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['concat', 'Ward ', ['get', 'ward_no']],
          'text-size': 10,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
          visibility: visible ? 'visible' : 'none'
        },
        paint: {
          'text-color': '#1F2937',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 1.5
        }
      });
    }
    
    // Add click handler
    const handleClick = (e: any) => {
      if (!onWardClick) return;
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: [fillLayerId]
      });
      
      if (features.length > 0) {
        const feature = features[0];
        const wardNo = feature.properties?.ward_no;
        const wardName = feature.properties?.ward_name || `Ward ${wardNo}`;
        
        if (wardNo) {
          onWardClick(wardNo, wardName);
        }
      }
    };
    
    map.on('click', fillLayerId, handleClick);
    
    // Add hover cursor
    map.on('mouseenter', fillLayerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', fillLayerId, () => {
      map.getCanvas().style.cursor = '';
    });
    
    // Cleanup
    return () => {
      map.off('click', fillLayerId, handleClick);
      map.off('mouseenter', fillLayerId);
      map.off('mouseleave', fillLayerId);
      
      if (map.getLayer(labelsLayerId)) map.removeLayer(labelsLayerId);
      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded, visible, highlightedWard, showLabels, onWardClick]);
  
  // Update layer visibility when visible prop changes
  useEffect(() => {
    if (!map || !isLoaded) return;
    
    const layers = ['ward-fill', 'ward-outline', 'ward-labels'];
    const visibility = visible ? 'visible' : 'none';
    
    layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    });
  }, [map, isLoaded, visible]);
  
  // Update highlighted ward
  useEffect(() => {
    if (!map || !isLoaded) return;
    
    const layers = ['ward-fill', 'ward-outline'];
    
    layers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setPaintProperty(
          layerId,
          layerId === 'ward-fill' ? 'fill-color' : 'line-color',
          [
            'case',
            ['==', ['get', 'ward_no'], highlightedWard ?? -1],
            layerId === 'ward-fill' ? '#FF6B6B' : '#DC2626',
            layerId === 'ward-fill' ? '#4A90E2' : '#2563EB'
          ]
        );
      }
    });
  }, [map, isLoaded, highlightedWard]);
  
  return null;
}

/**
 * Example Usage:
 * 
 * ```tsx
 * import { useState } from 'react';
 * import Map from 'react-map-gl';
 * import WardBoundaryLayer from '@/components/map/WardBoundaryLayer';
 * 
 * export default function MyMap() {
 *   const [selectedWard, setSelectedWard] = useState<number | null>(null);
 *   const [showWards, setShowWards] = useState(true);
 *   
 *   return (
 *     <div>
 *       <button onClick={() => setShowWards(!showWards)}>
 *         Toggle Wards
 *       </button>
 *       
 *       <Map
 *         initialViewState={{
 *           longitude: 77.5946,
 *           latitude: 12.9716,
 *           zoom: 11
 *         }}
 *         mapStyle="mapbox://styles/mapbox/streets-v12"
 *       >
 *         <WardBoundaryLayer
 *           visible={showWards}
 *           highlightedWard={selectedWard}
 *           showLabels={true}
 *           onWardClick={(wardNo, wardName) => {
 *             console.log(`Clicked: ${wardName}`);
 *             setSelectedWard(wardNo);
 *           }}
 *         />
 *       </Map>
 *       
 *       {selectedWard && (
 *         <div className="info-panel">
 *           Selected Ward: {selectedWard}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
