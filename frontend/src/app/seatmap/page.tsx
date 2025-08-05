"use client";

import React from "react";
import data from "./seat_map.json";
import { Button } from "@/components/ui/button";

interface SeatCell {
  id_cell: string | number;
  is_seat: boolean;
  x: number;
  y: number;
}

interface SeatBlock {
  class_name: string;
  cols: number;
  rows: number;
  cells: SeatCell[];
}

const SeatMapPage: React.FC = () => {
  return (
    <div className="w-full px-2 sm:px-6">
      {data.seat_map && data.seat_map.map((block: SeatBlock, blockIdx: number) => (
        <div
          key={blockIdx}
          className="seat-block mx-auto my-8 rounded-3xl shadow-lg p-2 sm:p-6 max-w-full sm:max-w-fit relative"
        >
          <div className="class-name text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center uppercase m-2 sm:m-4 md:m-6 px-2 sm:px-4">{block.class_name}</div>
          <div
            className="grid justify-center"
            style={{
              gridTemplateColumns: `repeat(${block.cols}, minmax(36px, 4vw))`,
              gridTemplateRows: `repeat(${block.rows}, minmax(36px, 4vw))`,
              gap: "3px",
              padding: "10px",
              placeItems: "center",
              background: "#1C1C1C",
              border: "2px solid #333",
              borderRadius: "12px",
            }}
          >
            {block.cells.map((cell: SeatCell) => (
              <div
                key={cell.id_cell}
                className={`cell ${cell.is_seat ? "seat" : "aisle"} flex items-center justify-center md:text-md font-medium p-4 sm:text-base`}
                style={{
                  gridColumn: cell.x + 1,
                  gridRow: cell.y + 1,
                  background: cell.is_seat ? "#90ee90" : "#1C1C1C",
                  color: cell.is_seat ? "#000" : "#fff",
                  borderRadius: "8px",
                  minWidth: "24px",
                  minHeight: "24px",
                  maxWidth: "8vw",
                  maxHeight: "8vw",
                }}
              >
                {cell.is_seat ? cell.id_cell : ""}
              </div>
            ))}
          </div>
        </div>
      ))}
    <div className="m-8 flex justify-center">
      <Button className="mt-4" onClick={() => alert("Booking functionality not implemented yet!")}>
      Book Selected Seats
    </Button>
    </div>
    </div>
  );
};

export default SeatMapPage;
