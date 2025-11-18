interface User {
  email: string
  lastname: string
  name: string
  avatar: string
  airline_code: string
}

interface Data {
  access_token: string
  message?: string
  // add other fields if needed
}

interface LogoutResponse {
  message?: string
}

/** interfaccia per lavorare con gli aerei fisici */
interface Aircraft {
  aircraft: {
    cabin_max_cols: number;
    double_deck: boolean;
    id_aircraft: number;
    manufacturer: {
      id_manufacturer: number;
      name: string;
    };
    max_economy_seats: number;
    name: string;
  };
  airline: {
    iata_code: string;
    name: string;
  };
  current_position: string;
  flying_towards: string | null;
  id_aircraft_airline: number;
}

/** compatibilità col codice che usa `Routes[]` */
interface Routes {
  routes: Route[];
}

/** dettaglio di una singola sezione di route */
interface RouteDetail {
  arrival_airport: string;
  arrival_time: string;
  departure_airport: string;
  departure_time: string;
  id_next: number | null;
  route_detail_id: number;
  route_section_id: number;
}

/** singola route */
interface Route {
  details: RouteDetail[];
  end_date: string;
  route_code: string;
  route_created_at?: string;
  start_date: string;
}

interface Ticket {
  id_buyer: number
  id_passenger_ticket: number
  passenger: {
    date_birth: string
    email: string
    lastname: string
    name: string
    passport_number: string
    phone_number: string
  }
  ticket: {
    id_ticket: number
    price: number
    flight: {
      airline: {
        iata_code: string
        name: string
      }
      base_price: number
      id_aircraft: number
      id_flight: number
      route_code: string
      scheduled_arrival_day: string
      scheduled_departure_day: string
      sections: {
        arrival_time: string
        departure_time: string
        id_airline_routes: number
        next_id: number | null
        section: {
          code_arrival_airport: string
          code_departure_airport: string
          id_routes_section: number
        }
      }[]
    }
  }
} 

interface Flights {
  flights: Flight[];
}
 
interface Flight {
  id_flight: string,
  route_code: string,
  airline_iata_code: string,
  arrival_day: string,
  arrival_time: string,
  base_price: number | null,
  departure_day: string,
  departure_time: string,
  destination: string,
  duration: string,
  id_flight: number,
  origin: string
}

// interface Flight {
  // id: string;
  // company_id: string;
  // flight_number: string;
  // origin: string;
  // destination: string;
  // departure_time: string;
  // arrival_time: string;
  // duration: string;
  // base_price: string;
  // total_seats: number;
  // available_seats: number;
  // class_config: { [key: string]: { seats_available: number; price_multiplier: number } };
// }

// interface Flight {
//   id: string;
//   flight_number: string;
//   origin: string;
//   destination: string;
//   departure_time: string;
//   arrival_time: string;
//   base_price: string;
//   available_seats: number;
// }

interface ApiSection {
  departure_time?: string;
  waiting_time?: number;
  departure_airport: string;
  arrival_airport: string;
  next_session: ApiSection | null;
}

interface CreateSeatBlockDialogProps {
  cabin_max_cols?: number
  max_economy_seats: number
  airline_code: string | undefined
  aircraft_code: { value: string }
  trigger?: React.ReactNode
}