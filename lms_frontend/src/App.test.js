import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders LMS home heading', () => {
  render(<BrowserRouter><App /></BrowserRouter>);
  const heading = screen.getByText(/Digital T3 LMS/i);
  expect(heading).toBeInTheDocument();
});
