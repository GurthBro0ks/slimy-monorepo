import '@testing-library/jest-dom';

// Set required environment variables for all tests
process.env.NEXT_PUBLIC_ADMIN_API_BASE = 'https://admin.example.test';
process.env.NEXT_PUBLIC_SNELP_CODES_URL = 'https://snelp.example.test/api/codes';
