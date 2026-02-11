import { randomUUID } from "crypto";
import type { IBookingsStore, Booking } from "./interfaces";

export class InMemoryBookingsStore implements IBookingsStore {
  private bookings: Booking[] = [];

  async create(data: Omit<Booking, "id" | "createdAt">): Promise<Booking> {
    const booking: Booking = {
      ...data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.bookings.push(booking);
    return booking;
  }
}
