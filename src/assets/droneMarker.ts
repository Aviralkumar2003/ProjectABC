export default function droneMarker() {
  const markerElement = document.createElement("div");
  markerElement.className = "marker";
  markerElement.style.backgroundImage = "url('/drone.svg')";
  markerElement.style.width = "40px";
  markerElement.style.height = "40px";
  markerElement.style.backgroundSize = '100%';
  markerElement.style.display = 'block';
  markerElement.style.border = 'none';
  markerElement.style.borderRadius = '50%';
  markerElement.style.cursor = 'pointer';
  markerElement.style.padding = "0";

  return markerElement;
}
