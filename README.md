# Qubiq - Quantum Computing Learning Platform

An AI-powered interactive quantum computing learning platform with 3D visualization, AI tutoring, and a futuristic dark UI.

## Features

- **Interactive Qubit Viewer**: 3D Bloch sphere visualization with real-time controls
- **AI Quantum Tutor**: Chat interface powered by RAG for quantum computing questions
- **Quantum Circuits**: Visual circuit builder (coming soon)
- **Error Playground**: Explore quantum errors and decoherence (coming soon)
- **Quantum Lab**: Virtual experiments (coming soon)

## Tech Stack

### Frontend
- React 18 with Vite
- Three.js / @react-three/fiber for 3D visualization
- React Router for navigation
- Framer Motion for animations

### Backend
- FastAPI (Python)
- LangChain for RAG pipeline
- FAISS for vector storage

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- pip

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

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   python main.py
   ```
   The API will run at `http://localhost:8000`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

### Usage

1. Open `http://localhost:5173` in your browser
2. Navigate using the sidebar to explore different sections
3. Visit the **Qubits** page to interact with the Bloch sphere
4. Use the **AI Tutor** panel on the right to ask quantum computing questions

## Project Structure

```
qubiq/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   ├── QubitViewer.jsx   # 3D Bloch sphere
│   │   │   └── TutorPanel.jsx    # AI chat interface
│   │   ├── pages/
│   │   │   ├── HomePage.jsx      # Landing page
│   │   │   ├── QubitsPage.jsx    # Qubit visualization
│   │   │   └── PlaceholderPages.jsx
│   │   ├── styles/
│   │   │   └── index.css         # Global styles
│   │   ├── App.jsx               # Main app component
│   │   └── main.jsx              # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── backend/
    ├── main.py                    # FastAPI application
    ├── requirements.txt           # Python dependencies
    └── data/
        └── quantum_docs.txt       # Knowledge base
```

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `POST /api/ask` - Ask a quantum computing question

## License

MIT
