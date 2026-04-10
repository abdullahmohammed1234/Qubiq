# Qubiq - Quantum Computing Learning Platform

An AI-powered interactive quantum computing learning platform with 3D visualization, AI tutoring, circuit simulation, and a futuristic dark UI.

## Features

- **Interactive Qubit Viewer**: 3D Bloch sphere visualization with real-time controls
- **AI Quantum Tutor**: Chat interface powered by RAG for quantum computing questions
- **Quantum Circuits**: Visual circuit builder with gate simulation
- **Error Playground**: Explore quantum errors and decoherence
- **Quantum Lab**: Virtual experiments with result visualization
- **Circuit Simulation**: Run quantum circuits with Qiskit or fallback simulation

## Tech Stack

### Frontend
- React 18 with Vite
- Three.js / @react-three/fiber for 3D visualization
- React Router for navigation
- Framer Motion for animations
- Recharts for data visualization

### Backend
- FastAPI (Python)
- LangChain for RAG pipeline
- FAISS for vector storage
- Google Gemini for LLM generation
- Qiskit for quantum simulation

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- pip
- Google Gemini API key

### Installation

1. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure API Key**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env and add your GEMINI_API_KEY
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   python server.py
   ```
   The API will run at `http://localhost:8001`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

3. **Build Knowledge Base** (first time only)
   ```bash
   curl -X POST http://localhost:8001/ingest
   ```

### Usage

1. Open `http://localhost:5173` in your browser
2. Navigate using the sidebar to explore different sections
3. Visit the **Qubits** page to interact with the Bloch sphere
4. Use the **AI Tutor** panel on the right to ask quantum computing questions
5. Build and simulate circuits on the **Circuits** page
6. Explore quantum errors on the **Error Playground**

## Project Structure

```
qubiq/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   │   ├── QubitViewer.jsx        # 3D Bloch sphere visualization
│   │   │   ├── TutorPanel.jsx         # AI chat interface
│   │   │   ├── CircuitBuilder.jsx      # Visual quantum circuit builder
│   │   │   ├── QuantumErrorPlayground.jsx  # Quantum error exploration
│   │   │   └── ResultChart.jsx        # Simulation results chart
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Landing page
│   │   │   ├── QubitsPage.jsx         # Qubit visualization
│   │   │   ├── CircuitsPage.jsx      # Circuit builder and simulation
│   │   │   ├── QuantumLab.jsx        # Virtual experiments
│   │   │   └── PlaceholderPages.jsx  # Placeholder components
│   │   ├── context/
│   │   │   └── AIMessageContext.jsx  # AI chat state management
│   │   ├── styles/
│   │   │   └── index.css             # Global styles
│   │   ├── App.jsx                   # Main app component
│   │   └── main.jsx                 # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── backend/
    ├── server.py                    # FastAPI application
    ├── query.py                     # RAG query pipeline
    ├── ingest.py                    # Knowledge base ingestion
    ├── requirements.txt             # Python dependencies
    └── .env.example                 # Environment template
```

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /status` - Detailed system status
- `POST /api/ask` - Ask a quantum computing question
- `POST /api/simulate` - Simulate a quantum circuit
- `POST /ingest` - Rebuild the knowledge base index

## License

MIT