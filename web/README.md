# Redrawn Web Frontend

This is the Next.js frontend for the Redrawn application - AI-filtered photo albums you can share.

## Architecture

The frontend connects directly to the Go backend API server. No Next.js API routes are used.

## Environment Variables

### Required for Development
- `NEXT_PUBLIC_API_URL` - URL of the backend API server (default: `http://localhost:8080`)

### Example `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Production Configuration
For production deployments, set:
- `NEXT_PUBLIC_API_URL=https://your-api-domain.com`

## How to run

### Development
```sh
npm install
npm run dev
```

### With Docker Compose
```sh
# From project root
make dev
# or
docker-compose up
```

## Technologies

This project is built with:

- Next.js 14
- TypeScript
- React
- shadcn/ui
- Tailwind CSS
- RTK Query (for API calls)
- Framer Motion (for animations)

## API Integration

The frontend uses RTK Query to communicate directly with the Go backend. All API calls are made to the backend server specified by `NEXT_PUBLIC_API_URL`.

### CORS Configuration

The backend is configured with CORS to allow requests from the frontend. In development, it allows requests from `localhost:3000` and `localhost:3001`.
