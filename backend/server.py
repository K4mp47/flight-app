from flask import Flask, jsonify, request
from flask_cors import CORS
from amadeus import Client, ResponseError
import datetime

app = Flask(__name__)
CORS(app)

amadeus = Client(
    client_id='ymvlwNLaMFLTlhDfdTTx0jOI9EDIKLB2',
    client_secret='kWMZyLOYGgLDfe7v'
)

@app.route('/api/seatmap', methods=['POST'])
def get_seatmap():
    try:
        flight_offer = request.json['flightOffer']
        response = amadeus.shopping.seatmaps.post({'data': [flight_offer]})
        return jsonify(response.data)
    except ResponseError as error:
        return jsonify({'error': str(error)}), 400

@app.route('/api/search', methods=['GET'])
def search_flights():
    try:
        today = datetime.date.today().strftime("%Y-%m-%d")
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode='NYC',
            destinationLocationCode='LON',
            departureDate=today,
            adults=1
        )
        return jsonify([response.data[2]])
    except ResponseError as error:
        return jsonify({'error': str(error)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
