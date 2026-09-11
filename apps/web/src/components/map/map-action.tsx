"use client";

import { Compass, LocateFixed, Minus, Plus } from "lucide-react";
import { useMap } from ".";
import { Separator } from "../separator";
import { MapStyleSelector } from "./map-style-selector";

export function MapAction() {
  const {
    onHandleZoomIn,
    onHandleZoomOut,
    onHandleCompass,
    onHandleActive3d,
    onHandleCenter,
    onHandleStyle,
  } = useMap();

  return (
    <div className="absolute right-2 top-2 flex flex-col items-end space-y-2 md:right-5 md:top-5">
      <div
        data-tour-control="zoom"
        className="w-10 overflow-hidden rounded-full bg-background shadow-md"
      >
        <button
          type="button"
          onClick={onHandleZoomIn}
          className="group hidden h-10 w-full items-center justify-center transition-all duration-200 hover:cursor-pointer active:scale-110 active:bg-blue-100 md:flex"
        >
          <Plus className="size-4 transition-transform duration-300 group-active:scale-125 md:size-5" />
        </button>
        <Separator />
        <button
          type="button"
          onClick={onHandleZoomOut}
          className="group hidden h-10 w-full items-center justify-center transition-all duration-200 hover:cursor-pointer active:scale-110 active:bg-blue-100 md:flex"
        >
          <Minus className="size-4 transition-transform duration-300 group-active:scale-125 md:size-5" />
        </button>
      </div>

      <button
        type="button"
        data-tour-control="compass"
        onClick={onHandleCompass}
        className="group hidden size-10 items-center justify-center rounded-full bg-background shadow-md transition-all duration-200 hover:cursor-pointer active:scale-110 active:bg-blue-100 md:flex"
      >
        <Compass className="size-4 transition-transform duration-300 group-active:scale-125 md:size-5" />
      </button>

      <button
        type="button"
        data-tour-control="location"
        onClick={onHandleCenter}
        className="group flex size-12 items-center justify-center rounded-full bg-background shadow-md transition-all duration-200 hover:cursor-pointer active:scale-110 active:bg-blue-100 md:size-10"
      >
        <LocateFixed className="size-7 transition-transform duration-300 group-active:scale-125 md:size-5" />
      </button>

      <MapStyleSelector onSelectStyle={onHandleStyle} />

      <button
        type="button"
        onClick={onHandleActive3d}
        className="group hidden size-10 items-center justify-center rounded-full bg-background shadow-md transition-all duration-200 hover:cursor-pointer active:scale-110 active:bg-blue-100 md:flex [html[data-map-tutorial-map-controls]_&]:!hidden"
      >
        <span className="font-semibold">3D</span>
      </button>
    </div>
  );
}
