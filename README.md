# AI RubberDucker

A full-stack application that helps developers debug their code using AI assistance.

## Features

- User authentication and authorization
- Interactive chatbot for code debugging
- Code submission and evaluation
- Dashboard with user statistics and recent activity
- MongoDB database integration

## Tech Stack

- **Frontend**: React.js
- **Backend**: Python (FastAPI)
- **Database**: MongoDB
- **Authentication**: JWT

## Project Structure

```
.
├── backend/           # FastAPI backend
│   ├── main.py       # Main application file
│   └── requirements.txt
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:
   Create a `.env` file in the backend directory with:

```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. Run the backend server:

```bash
python main.py
```

### Frontend Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Set up environment variables:
   Create a `.env` file in the frontend directory with:

```
REACT_APP_API_URL=http://localhost:8000
```

3. Start the development server:

```bash
npm start
```

## Contributing

This project is maintained by the AI RubberDucker Team. External contributions are not currently accepted.

## License

This project is protected under the AI RubberDucker License. See the LICENSE file for details.

Key points of the license:

- Viewing and using the source code is permitted
- Modifications are restricted to the AI RubberDucker Team only
- No redistribution of modified versions is allowed
- Commercial use of modified versions is prohibited

For any inquiries about the project or licensing, please contact the AI RubberDucker Team.
