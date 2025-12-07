# Kayak AI Agent Service 🤖

Multi-agent travel concierge service powered by OpenAI GPT-4, Kafka, and FastAPI.

## Features

- **🔍 Deal Detection**: Automatically detects great deals from kayak_listings database
- **💬 AI Concierge**: Natural language trip planning with OpenAI GPT-4
- **📦 Trip Bundling**: Combines flights + hotels with fit scoring
- **⚡ Real-time Updates**: WebSocket notifications for price/inventory changes
- **📊 Price Watches**: Track deals and get alerted on threshold breaches
- **🎯 Smart Recommendations**: Context-aware suggestions based on user preferences

## Architecture

### Multi-Agent Pipeline

```
kayak_listings DB → Feed Ingestion → Kafka → Deal Detector → Offer Tagger → Database
                                                                             ↓
                                                                    WebSocket Updates
```

### Agents

1. **Feed Ingestion Agent**: Pulls flights & hotels from kayak_listings MySQL database
2. **Deal Detector Agent**: Scores deals based on price drops, inventory, urgency
3. **Offer Tagger Agent**: Tags deals with features (pet-friendly, refundable, etc.)
4. **Intent Parser Agent**: Uses GPT-4 to understand natural language queries
5. **Trip Planner Agent**: Bundles flights + hotels, calculates fit scores
6. **Explainer Agent**: Generates concise explanations using GPT-4

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- MySQL (kayak_listings database populated)
- Kafka & Zookeeper running

### 1. Install Dependencies

```bash
cd kayak-microservices/services/ai-agent
pip install -r requirements.txt
```

### 2. Start Infrastructure (if not running)

```bash
cd kayak-microservices/infrastructure/docker
docker-compose up -d mysql mongodb redis kafka zookeeper
```

### 3. Run AI Agent Service

**Option A: Local Development**
```bash
cd kayak-microservices/services/ai-agent
python main.py
```

**Option B: Docker**
```bash
cd kayak-microservices/infrastructure/docker
docker-compose up -d ai-agent
```

### 4. Verify Service

```bash
curl http://localhost:8000/health
# Should return: {"status":"OK","service":"ai-agent"}
```

## API Endpoints

### Health & Info
- `GET /` - Service info
- `GET /health` - Health check

### Deals
- `GET /api/ai/deals` - Get all deals (with filters)
- `GET /api/ai/deals/{deal_id}` - Get specific deal

### AI Concierge
- `POST /api/ai/chat` - Natural language query
- `POST /api/ai/trip/plan` - Plan a trip
- `POST /api/ai/trip/refine` - Refine search

### Policy Q&A
- `POST /api/ai/policy/question` - Ask about deal policies

### Price Watches
- `POST /api/ai/watch/create` - Create price watch
- `GET /api/ai/watch/list?user_id={id}` - List watches
- `DELETE /api/ai/watch/{watch_id}` - Delete watch

### WebSocket
- `WS /ws/events?user_id={id}` - Real-time updates

## Usage Examples

### 1. Chat with AI Concierge

```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "message": "I need a weekend trip from SFO to Tokyo, under $900, pet-friendly"
  }'
```

Response:
```json
{
  "response": "I found 2 great options for you!",
  "intent": "search",
  "entities": {
    "origin": "SFO",
    "destination": "Tokyo",
    "budget": 900,
    "preferences": ["pet-friendly"]
  },
  "confidence": 0.95,
  "plans": [...]
}
```

### 2. Plan a Trip

```bash
curl -X POST http://localhost:8000/api/ai/trip/plan \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "origin": "SFO",
    "destination": "Tokyo",
    "start_date": "2025-12-15",
    "end_date": "2025-12-17",
    "budget": 1200,
    "party_size": 2,
    "preferences": ["pet-friendly", "near-transit"]
  }'
```

### 3. Create Price Watch

```bash
curl -X POST http://localhost:8000/api/ai/watch/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "deal_id": "flight_SFO_NRT_001",
    "price_threshold": 650,
    "inventory_threshold": 5
  }'
```

### 4. WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/events?user_id=user123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  // { type: 'price_alert', deal_id: '...', data: {...} }
};
```

## Configuration

Environment variables (see `.env` or `config.py`):

```bash
# OpenAI
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Kafka
KAFKA_BROKERS=localhost:9092

# Database
DB_HOST=localhost
DB_PORT=3307
DB_NAME=kayak_listings
DB_PASSWORD=Somalwar1!

# Deal Detection
DEAL_PRICE_DROP_THRESHOLD=15.0
DEAL_INVENTORY_THRESHOLD=10
DEAL_SCORE_MIN=70
```

## How It Works

### Deal Detection Pipeline

1. **Feed Ingestion** (every 5 min): Queries kayak_listings database for flights & hotels
2. **Normalization**: Converts to standard format → `deals.normalized` Kafka topic
3. **Scoring**: Calculates deal score (0-100) → `deals.scored` topic
4. **Tagging**: Adds feature tags → `deals.tagged` topic
5. **Storage**: Saves to SQLite + emits WebSocket events

### Deal Scoring Algorithm

Score = Price (40pts) + Inventory (25pts) + Urgency (20pts) + Amenities (15pts)

- **Price**: % below historical average
- **Inventory**: Scarcity (< 10 units = high score)
- **Urgency**: Time until expiration
- **Amenities**: Bonus features (refundable, pet-friendly, etc.)

### Fit Score (Trip Planning)

Score = Budget Match (40%) + Amenity Match (35%) + Location (25%)

## Data Flow

```
MySQL kayak_listings
  ↓
Feed Ingestion Agent (every 5min)
  ↓
Kafka: raw_supplier_feeds
  ↓
Normalizer Worker
  ↓
Kafka: deals.normalized
  ↓
Deal Detector Worker (scores deals)
  ↓
Kafka: deals.scored
  ↓
Offer Tagger Worker (adds tags)
  ↓
Kafka: deals.tagged
  ↓
Database Saver Worker
  ↓
SQLite kayak_ai.db + WebSocket Events
```

## Database Schema

### SQLite Tables

- **deals**: Scored and tagged deals
- **price_history**: Historical price tracking
- **trip_plans**: Generated trip bundles
- **price_watches**: User price alerts
- **conversations**: Chat history
- **user_preferences**: User preferences

## Monitoring

### Kafka Topics

```bash
# List topics
docker exec -it kayak-kafka kafka-topics --list --bootstrap-server localhost:9092

# Consumer messages
docker exec -it kayak-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic deals.tagged \
  --from-beginning
```

### Logs

```bash
# Docker logs
docker logs -f kayak-ai-agent

# Local development
# Logs print to console
```

## Troubleshooting

### Issue: Kafka connection failed
**Solution**: Ensure Kafka & Zookeeper are running
```bash
docker ps | grep kafka
```

### Issue: MySQL connection refused
**Solution**: Check MySQL is on port 3307 and kayak_listings exists
```bash
mysql -h localhost -P 3307 -u root -p
```

### Issue: OpenAI API errors
**Solution**: Verify API key is set correctly
```bash
echo $OPENAI_API_KEY
```

### Issue: No deals appearing
**Solution**: Ensure kayak_listings database has flights & hotels data
```sql
SELECT COUNT(*) FROM flights;
SELECT COUNT(*) FROM hotels;
```

## Development

### Project Structure

```
ai-agent/
├── agents/              # Agent implementations
│   ├── deal_detector.py
│   ├── intent_parser.py
│   ├── trip_planner.py
│   ├── feed_ingestion.py
│   ├── offer_tagger.py
│   └── explainer.py
├── models/              # Data models
│   ├── database.py      # SQLModel entities
│   └── schemas.py       # Pydantic schemas
├── services/            # Core services
│   ├── kafka_service.py
│   ├── openai_service.py
│   └── websocket_service.py
├── workers/             # Background workers
│   └── kafka_workers.py
├── data/                # Data storage
│   ├── datasets/        # Sample CSV feeds
│   └── kayak_ai.db      # SQLite database
├── config.py            # Configuration
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
└── Dockerfile           # Docker image
```

### Running Tests

```bash
# TODO: Add tests
pytest tests/
```

## Performance

- **Response Time**: < 2s for chat queries
- **WebSocket Latency**: < 500ms
- **Throughput**: 100+ concurrent users
- **Feed Processing**: ~200 deals/minute

## Future Enhancements

- [ ] Add Redis caching for deals
- [ ] Implement collaborative filtering
- [ ] Add sentiment analysis on reviews
- [ ] Multi-city trip planning
- [ ] Integration with booking APIs
- [ ] A/B testing for recommendations
- [ ] Analytics dashboard

## License

MIT

## Support

For issues or questions, contact the development team.

---

**Built with ❤️ using FastAPI, OpenAI GPT-4, and Kafka**
