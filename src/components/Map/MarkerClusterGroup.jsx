import { createLayerComponent, createElementObject } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const MarkerClusterGroup = createLayerComponent(
  function createMarkerClusterGroup(
    { children: _children, eventHandlers: _eventHandlers, ...props },
    ctx
  ) {
    // Pass all props through to MarkerClusterGroup to preserve all options
    const instance = new L.MarkerClusterGroup(props);

    return createElementObject(instance, {
      ...ctx,
      layerContainer: instance,
    });
  },
  function updateMarkerClusterGroup(instance, props, prevProps) {
    // Handle prop updates if needed
    if (props.maxClusterRadius !== prevProps.maxClusterRadius) {
      instance.options.maxClusterRadius = props.maxClusterRadius;
    }
    if (props.disableClusteringAtZoom !== prevProps.disableClusteringAtZoom) {
      instance.options.disableClusteringAtZoom = props.disableClusteringAtZoom;
    }
  }
);

export default MarkerClusterGroup;
