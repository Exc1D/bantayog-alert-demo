import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import centroid from '@turf/centroid';
import distance from '@turf/distance';
import fs from 'node:fs';

const boundaries = JSON.parse(fs.readFileSync(new URL('../src/data/camarines-norte-boundaries.json', import.meta.url), 'utf8'));
const features = boundaries.features;

function bbox(feature) {
  const coords = feature.geometry.coordinates[0];
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return { minLng, minLat, maxLng, maxLat };
}

function bboxIntersects(a, b) {
  return !(
    a.maxLng < b.minLng ||
    a.minLng > b.maxLng ||
    a.maxLat < b.minLat ||
    a.minLat > b.maxLat
  );
}

function polygonHasPointInsideFeature(featureA, featureB) {
  const ring = featureA.geometry.coordinates[0];
  return ring.some(([lng, lat]) => booleanPointInPolygon(point([lng, lat]), featureB));
}

const EXPECTED_MUNICIPALITIES = [
  'Basud',
  'Capalonga',
  'Daet',
  'Jose Panganiban',
  'Labo',
  'Mercedes',
  'Paracale',
  'San Lorenzo Ruiz',
  'San Vicente',
  'Santa Elena',
  'Talisay',
  'Vinzons'
];

console.log('== Municipality boundary audit ==');
console.log(`Feature count: ${features.length}`);

const names = features.map((f) => f.properties.name).sort();
const expectedSorted = [...EXPECTED_MUNICIPALITIES].sort();
const missing = expectedSorted.filter((name) => !names.includes(name));
const unexpected = names.filter((name) => !expectedSorted.includes(name));

console.log(`Missing municipalities: ${missing.length ? missing.join(', ') : 'none'}`);
console.log(`Unexpected municipalities: ${unexpected.length ? unexpected.join(', ') : 'none'}`);

const overlaps = [];
for (let i = 0; i < features.length; i += 1) {
  for (let j = i + 1; j < features.length; j += 1) {
    const a = features[i];
    const b = features[j];
    if (!bboxIntersects(bbox(a), bbox(b))) continue;

    const overlapByVertices =
      polygonHasPointInsideFeature(a, b) ||
      polygonHasPointInsideFeature(b, a) ||
      booleanPointInPolygon(centroid(a), b) ||
      booleanPointInPolygon(centroid(b), a);

    if (overlapByVertices) {
      overlaps.push(`${a.properties.name} ↔ ${b.properties.name}`);
    }
  }
}

console.log(`Potential overlaps detected: ${overlaps.length}`);
overlaps.forEach((pair) => console.log(`  - ${pair}`));

const allCoords = features.flatMap((f) => f.geometry.coordinates[0]);
const lngValues = allCoords.map(([lng]) => lng);
const latValues = allCoords.map(([, lat]) => lat);
const provinceSpan = {
  lng: Math.max(...lngValues) - Math.min(...lngValues),
  lat: Math.max(...latValues) - Math.min(...latValues)
};

console.log(`Overall extent span: ${provinceSpan.lng.toFixed(3)}° lng × ${provinceSpan.lat.toFixed(3)}° lat`);

const centroids = features.map((f) => ({
  name: f.properties.name,
  point: centroid(f)
}));

let nearestPair = null;
let farthestPair = null;
for (let i = 0; i < centroids.length; i += 1) {
  for (let j = i + 1; j < centroids.length; j += 1) {
    const d = distance(centroids[i].point, centroids[j].point, { units: 'kilometers' });
    const pair = `${centroids[i].name} ↔ ${centroids[j].name}`;

    if (!nearestPair || d < nearestPair.distanceKm) {
      nearestPair = { pair, distanceKm: d };
    }

    if (!farthestPair || d > farthestPair.distanceKm) {
      farthestPair = { pair, distanceKm: d };
    }
  }
}

console.log(`Nearest centroid pair: ${nearestPair.pair} (${nearestPair.distanceKm.toFixed(2)} km)`);
console.log(`Farthest centroid pair: ${farthestPair.pair} (${farthestPair.distanceKm.toFixed(2)} km)`);

console.log('\nInterpretation:');
console.log('- If many overlaps are listed, report-to-municipality sorting can be ambiguous.');
console.log('- Very large centroid distances within one province may indicate simplified/non-authoritative polygons.');
