from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import anthropic
import googlemaps
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/generate-itinerary", methods=["POST"])
def generate_itinerary():
    data = request.json
    destination = data.get("destination", "")
    duration = data.get("duration", 3)
    interests = data.get("interests", [])
    budget = data.get("budget", "moderate")
    travel_style = data.get("travel_style", "balanced")

    # Get place info from Google Maps
    place_info = ""
    try:
        geocode = gmaps.geocode(destination)
        if geocode:
            place_info = f"Coordinates: {geocode[0]['geometry']['location']}"
    except Exception:
        pass

    message = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system="""You are an expert travel planner with deep knowledge of destinations worldwide.
Create detailed, practical itineraries that balance must-see sights with authentic local experiences.
Format all itineraries as valid JSON.""",
        messages=[{
            "role": "user",
            "content": f"""Create a {duration}-day itinerary for {destination}.

Travel preferences:
- Interests: {', '.join(interests)}
- Budget level: {budget}
- Travel style: {travel_style}
{f'- Location context: {place_info}' if place_info else ''}

Return a JSON object with:
{{
  "destination": "...",
  "duration": {duration},
  "overview": "2-3 sentence trip overview",
  "budget_estimate": "daily budget range",
  "days": [
    {{
      "day": 1,
      "theme": "day theme",
      "morning": {{"activity": "...", "location": "...", "duration": "...", "cost": "..."}},
      "afternoon": {{"activity": "...", "location": "...", "duration": "...", "cost": "..."}},
      "evening": {{"activity": "...", "location": "...", "duration": "...", "cost": "..."}},
      "tips": "local tip for the day"
    }}
  ],
  "practical_tips": ["tip1", "tip2", "tip3"],
  "affiliate_suggestions": {{"hotels": "...", "tours": "...", "transport": "..."}}
}}"""
        }]
    )

    text = message.content[0].text
    try:
        import json, re
        json_match = re.search(r'\{[\s\S]*\}', text)
        itinerary = json.loads(json_match.group()) if json_match else {"raw": text}
        return jsonify({"itinerary": itinerary})
    except Exception:
        return jsonify({"itinerary": {"raw": text}})


@app.route("/api/place-details", methods=["POST"])
def place_details():
    data = request.json
    place_name = data.get("place", "")
    try:
        results = gmaps.places(place_name)
        if results.get("results"):
            place = results["results"][0]
            return jsonify({
                "name": place.get("name"),
                "rating": place.get("rating"),
                "address": place.get("formatted_address"),
                "place_id": place.get("place_id"),
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Not found"}), 404


if __name__ == "__main__":
    app.run(debug=True, port=5000)
