# Donatii - Stripe Integration Test Project

## About
Donatii is a test project created to explore and test the integration of the Stripe payment system in a Vue 3 application. The project demonstrates the implementation of both one-time payments and subscriptions through Stripe, as well as HTTPS/TLS setup for secure payment processing.

## Main Features
- Stripe integration for payment processing
- One-time payment implementation
- Subscription setup through Stripe
- Secure payment processing via HTTPS/TLS
- Test mode for safe payment testing

## Technologies
- Vue 3
- Vite
- Vue Router
- Pinia (for state management)
- Stripe.js
- HTTPS/TLS

## Development Setup

### Dependencies Installation
```sh
npm install
```

### Development Server
```sh
npm run dev
```
The application will be available at `http://localhost:5173`

### Production Build
```sh
npm run build
```

### Code Linting
```sh
npm run lint
```

## Project Structure
```
donatii/
├── src/
│   ├── assets/        # Static resources
│   ├── components/    # Vue components
│   ├── views/         # Application pages
│   ├── router/        # Routing configuration
│   ├── stores/        # Pinia stores
│   ├── API/          # Stripe API integration
│   └── App.vue        # Root component
├── public/            # Public files
└── index.html         # Entry point
```

## Note
This project is created solely for testing and learning Stripe integration. For production use, you need to:
1. Set up your own Stripe account
2. Replace test keys with real ones
3. Configure SSL certificate
4. Implement additional validation and error handling

## License
MIT
