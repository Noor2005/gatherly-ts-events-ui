import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AddEventForm from "./AddEventForm";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null }),
  useParams: () => ({}),
}));

jest.mock("../../../utils/TimeZoneUtils", () => ({
  getTimezoneAbbreviation: () => "UTC",
  getUserTimezone: () => "UTC",
}));

jest.mock("../../Services/EventService", () => ({
  __esModule: true,
  default: {
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    getEventById: jest.fn(),
  },
}));

test("renders an upload image field", () => {
  render(
    <MemoryRouter>
      <AddEventForm />
    </MemoryRouter>
  );

  expect(screen.getByLabelText(/upload event image/i)).toBeInTheDocument();
});
