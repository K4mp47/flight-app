"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [flightOffers, setFlightOffers] = useState<
    {
      itineraries: {
        segments: { carrierCode: string; flightNumber: string }[];
      }[];
    }[]
  >([]);
  const [seatMap, setSeatMap] = useState<SeatMap[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/search")
      .then(res => setFlightOffers(res.data))
      .catch(err => console.error(err));
  }, []);

  interface FlightSegment {
    carrierCode: string;
    flightNumber: string;
  }

  interface Itinerary {
    segments: FlightSegment[];
  }

  interface FlightOffer {
    itineraries: Itinerary[];
  }

  interface Seat {
    number: string;
    availability: string;
    travelerPricing?: { seatAvailabilityStatus?: string }[];
  }

  interface Deck {
    seats: Seat[];
  }

  interface SeatMap {
    decks: Deck[];
  }

  const fetchSeatMap = React.useCallback((offer: FlightOffer): void => {
    axios
      .post<SeatMap[]>("http://localhost:5000/api/seatmap", {
        flightOffer: offer,
      })
      .then(res => setSeatMap(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    // Optional: Fetch seat map for the first flight offer on initial load
    if (flightOffers.length > 0) {
      fetchSeatMap(flightOffers[0]);
    }
  }, [fetchSeatMap, flightOffers]);

  return (
    <div className="App">
      <h1>Amadeus Seat Map Viewer</h1>
      {flightOffers.map((offer, index) => (
        <div key={index}>
          <p>
            <strong>Flight:</strong>{" "}
            {offer.itineraries?.[0]?.segments?.[0]?.carrierCode}{" "}
            {offer.itineraries[0].segments[0].flightNumber}
          </p>
          <button onClick={() => fetchSeatMap(offer)}>View Seat Map</button>
        </div>
      ))}
      <div className="seatmap">
        {seatMap.length > 0 &&
          seatMap[0].decks[0].seats.map((seat, idx) => {
            const status =
              seat.travelerPricing?.[0]?.seatAvailabilityStatus?.toUpperCase() ||
              "UNKNOWN";
            return (
              <div key={idx} className={`seat ${status}`}>
                {seat.number}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default App;
