from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId  # Import ObjectId from bson module
import os
import logging
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.export import ConsoleSpanExporter
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.pymongo import PymongoInstrumentor


provider = TracerProvider()
processor = BatchSpanProcessor(ConsoleSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(
  TracerProvider(
    resource=Resource.create({SERVICE_NAME: "python-db-service"})
  )
)
jaeger_exporter = JaegerExporter(
  agent_host_name = os.getenv("JAEGER_AGENT_HOST"),
  agent_port = int(os.getenv("JAEGER_AGENT_PORT"))
)
trace.get_tracer_provider().add_span_processor(
  BatchSpanProcessor(jaeger_exporter)
)


app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()
PymongoInstrumentor().instrument()
CORS(app)  # Enable CORS for your Flask app


mongo_host = os.getenv("MONGO_HOST")  # Use a default IP address if not set
mongo_port = os.getenv("MONGO_PORT")  # Use a default port if not set


# Connect to your MongoDB database
mongo_uri = f"mongodb://{mongo_host}:{mongo_port}"
client = MongoClient(mongo_uri)
db = client['details']  # Replace 'your_database_name' with your MongoDB database name
collection = db['collectionName']  # Replace 'your_collection_name' with your collection name


SEARCH_NAME = "nandhu"

# Define an endpoint to fetch data
@app.route('/mongodb', methods=['GET'])
def get_data():
    try:
        args = request.args
        queryParam = args.get("name")
        print(args.get("name"))
        query1 = {"name": queryParam}

        if queryParam == SEARCH_NAME:
            data = list(collection.find(query1))
        elif queryParam == "":
            data = list(collection.find({}))
        elif queryParam == "nand":
            data = list(collection.find(query1))
        elif queryParam is None:
            return 'no queryParam is given', 500
        else:
            data = list(collection.find({"name": "kandhu"}))

        print(data)

        if len(data):
            for item in data:
                item['_id'] = str(item['_id'])

            result = {"status": "Success", "data": data}
            return jsonify(result)
        else:
            result = {"status": "Failure", "message": "No Data Available", "data": data}
            return jsonify(result)
    except Exception as e:
        logging.error(f"MongoDB Query Error: {str(e)}")
        return 'No Data Available for these name', 400

if __name__ == '__main__':
    app.run(debug=True, port=3002)
