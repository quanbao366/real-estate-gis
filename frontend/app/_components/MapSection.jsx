"use client";

import dynamic from "next/dynamic";
import MapSectionClient from "./MapSectionClient";

// Wrapper component: chỉ render MapSectionClient ở client (ssr:false).
// Toàn bộ logic Leaflet nằm trong MapSectionClient.jsx.
const MapSection = (props) => {
  const ClientOnly = dynamic(() => Promise.resolve(MapSectionClient), {
    ssr: false,
  });

  return <ClientOnly {...props} />;
};

export default MapSection;
