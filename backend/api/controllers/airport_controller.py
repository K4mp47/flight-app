from flask import jsonify
from sqlalchemy.orm import Session
from ..models.airport import Airport
from ..models.city import City
from ..query.airport_query import *


class Airport_controller:

    def __init__(self, session: Session):
        self.session = session

    def create_airport(self, data: dict):
        """Create a new airport - Admin only"""
        try:
            # Check if city exists
            city = self.session.get(City, data.get('id_city'))
            if not city:
                return {"message": "City not found"}, 404

            # Check if airport already exists
            existing_airport = self.session.get(Airport, data.get('iata_code'))
            if existing_airport:
                return {"message": "Airport with this IATA code already exists"}, 400

            new_airport = Airport(
                iata_code=data['iata_code'],
                id_city=data['id_city'],
                name=data['name'],
                latitude=data['latitude'],
                longitude=data['longitude'],
            )

            self.session.add(new_airport)
            self.session.commit()
            self.session.refresh(new_airport)

            return {"message": "Airport created successfully", "airport": new_airport.to_dict()}, 201

        except Exception as e:
            self.session.rollback()
            return {"message": f"Error creating airport: {str(e)}"}, 500

    def get_airport(self, iata_code: str):
        """Get airport by IATA code - All roles"""
        try:
            airport = get_airport_by_iata_code(self.session, iata_code)
            if not airport:
                return {"message": "Airport not found"}, 404

            return {"airport": airport.to_dict()}, 200

        except Exception as e:
            return {"message": f"Error retrieving airport: {str(e)}"}, 500

    def get_all_airports(self, page: int = 1, per_page: int = 50):
        """Get all airports with pagination - All roles"""
        try:
            airports = get_all_airports_paginated(self.session, page, per_page)
            total_count = get_airports_count(self.session)

            return {
                "airports": [airport.to_dict() for airport in airports],
                "total": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_count + per_page - 1) // per_page
            }, 200

        except Exception as e:
            return {"message": f"Error retrieving airports: {str(e)}"}, 500

    def get_airports_by_city(self, city_id: int):
        """Get airports by city - All roles"""
        try:
            airports = get_airports_by_city_id(self.session, city_id)
            return {"airports": [airport.to_dict() for airport in airports]}, 200

        except Exception as e:
            return {"message": f"Error retrieving airports: {str(e)}"}, 500

    def update_airport(self, iata_code: str, data: dict):
        """Update airport - Admin only"""
        try:
            airport = self.session.get(Airport, iata_code)
            if not airport:
                return {"message": "Airport not found"}, 404

            if data['name'] is not None:
                airport.name = data['name']

            if data['latitude'] is not None:
                airport.latitude = data['latitude']

            if data['longitude'] is not None:
                airport.longitude = data['longitude']

            if data['id_city'] is not None:
                city = self.session.get(City, data['id_city'])
                if city is None:
                    return {"message": "City not found"}, 404

            self.session.commit()

            return {"message": "Airport updated successfully", "airport": airport.to_dict()}, 200

        except Exception as e:
            self.session.rollback()
            return {"message": f"Error updating airport: {str(e)}"}, 500

    def delete_airport(self, iata_code: str):
        """Delete airport - Admin only"""
        try:
            airport = self.session.get(Airport, iata_code)
            if not airport:
                return {"message": "Airport not found"}, 404

            self.session.delete(airport)
            self.session.commit()

            return {"message": "Airport deleted successfully"}, 200

        except Exception as e:
            self.session.rollback()
            return {"message": f"Error deleting airport: {str(e)}"}, 500

    def search_airports(self, query: str):
        """Search airports by name or IATA code - All roles"""
        try:
            airports = search_airports_by_name_or_code(self.session, query)
            return {"airports": [airport.to_dict() for airport in airports]}, 200

        except Exception as e:
            return {"message": f"Error searching airports: {str(e)}"}, 500
