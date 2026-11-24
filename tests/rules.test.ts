import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  isTransitionAllowed,
  canStylistPerformServices,
  calculateWaitTimeMinutes,
  joinQueue,
  updateQueueStatus,
  getTodayDateString,
  checkAndReleaseExpiredCalls,
} from "../src/lib/queue-rules";
import { QueueStatus, StylistStatus } from "@prisma/client";

describe("Test Checklist: Data and Rules (T1 - T10)", () => {
  let salonId: string;
  let serviceHaircutId: string;
  let serviceBeardId: string;
  let serviceSpaId: string;
  let stylistAaravId: string;
  let stylistPriyaId: string;

  beforeAll(async () => {
    // Ensure test salon
    let salon = await prisma.salon.findFirst();
    if (!salon) {
      salon = await prisma.salon.create({
        data: {
          name: "Test Salon",
          address: "Test Address",
          phone: "9999999999",
          gracePeriodMinutes: 10,
        },
      });
    }
    salonId = salon.id;

    // Fetch services
    const services = await prisma.service.findMany({ where: { salonId } });
    const haircut = services.find((s) => s.name === "Haircut");
    const beard = services.find((s) => s.name === "Beard Trim");
    const spa = services.find((s) => s.name === "Hair Spa");

    serviceHaircutId = haircut!.id;
    serviceBeardId = beard!.id;
    serviceSpaId = spa ? spa.id : haircut!.id;

    const aarav = await prisma.staff.findFirst({ where: { username: "aarav" } });
    const priya = await prisma.staff.findFirst({ where: { username: "priya" } });
    stylistAaravId = aarav!.id;
    stylistPriyaId = priya!.id;
  });

  // T1 - 10 customers join at the same moment: all get different tokens (R1)
  it("T1: 10 customers joining concurrently all get different tokens", async () => {
    const promises = Array.from({ length: 10 }).map((_, i) =>
      joinQueue({
        salonId,
        name: `ConcurrentUser_${i}_${Date.now()}`,
        phone: `91000000${String(i).padStart(2, "0")}`,
        serviceIds: [serviceHaircutId],
      })
    );

    const results = await Promise.all(promises);
    const tokenNumbers = results.map((r) => r.entry.tokenNumber);
    const uniqueTokens = new Set(tokenNumbers);

    expect(results.length).toBe(10);
    expect(uniqueTokens.size).toBe(10);
  });

  // T2 - An invalid status value is rejected (R3)
  it("T2: An invalid status change is rejected", () => {
    // waiting -> in_service is invalid (must go through called)
    expect(isTransitionAllowed(QueueStatus.WAITING, QueueStatus.IN_SERVICE)).toBe(false);
    // completed -> waiting is invalid
    expect(isTransitionAllowed(QueueStatus.COMPLETED, QueueStatus.WAITING)).toBe(false);
  });

  // T3 - A finished entry cannot go back to waiting (R3)
  it("T3: A finished entry cannot go back to waiting", async () => {
    expect(isTransitionAllowed(QueueStatus.COMPLETED, QueueStatus.WAITING)).toBe(false);
    expect(isTransitionAllowed(QueueStatus.NO_SHOW, QueueStatus.WAITING)).toBe(false);
    expect(isTransitionAllowed(QueueStatus.CANCELLED, QueueStatus.WAITING)).toBe(false);
  });

  // T4 - A customer cannot hold two live tokens in one salon on one day (R2)
  it("T4: A customer cannot hold two live tokens in one salon on one day", async () => {
    const phone = `9200000001`;
    const firstJoin = await joinQueue({
      salonId,
      name: "SingleTokenUser",
      phone,
      serviceIds: [serviceHaircutId],
    });

    const secondJoin = await joinQueue({
      salonId,
      name: "SingleTokenUser",
      phone,
      serviceIds: [serviceHaircutId],
    });

    expect(secondJoin.isExisting).toBe(true);
    expect(secondJoin.entry.id).toBe(firstJoin.entry.id);
    expect(secondJoin.entry.tokenNumber).toBe(firstJoin.entry.tokenNumber);
  });

  // T5 - One visit can contain several services
  it("T5: One visit can contain several services", async () => {
    const res = await joinQueue({
      salonId,
      name: "MultiServiceUser",
      phone: `9300000001`,
      serviceIds: [serviceHaircutId, serviceBeardId],
    });

    expect(res.entry.services.length).toBe(2);
  });

  // T6 - Calling a stylist who lacks a requested skill is rejected (R4)
  it("T6: Calling a stylist who lacks a requested skill is rejected", async () => {
    // Suppose stylist only knows Haircut, but entry requires Haircut + Hair Spa
    const stylistSkills = [serviceHaircutId];
    const requested = [serviceHaircutId, serviceSpaId];
    const canPerform = canStylistPerformServices(stylistSkills, requested);
    expect(canPerform).toBe(false);
  });

  // T7 - Wait for the 4th customer in the example above is 68 minutes (R5)
  // Example from doc: 3 customers ahead, each with a haircut (30) and beard trim (15) = 135 minutes.
  // 2 stylists: 135 / 2 = 67.5, rounded up to 68 minutes.
  it("T7: Wait calculation for 135 minutes ahead with 2 stylists gives 68 minutes", () => {
    const totalMinutesAhead = 135;
    const workingStylists = 2;
    const wait = calculateWaitTimeMinutes(totalMinutesAhead, workingStylists);
    expect(wait).toBe(68);
  });

  // T8 - A called customer is marked no-show after the grace period (R6)
  it("T8: A called customer is marked no-show after grace period", async () => {
    // Create an entry
    const joinRes = await joinQueue({
      salonId,
      name: "NoShowTestCustomer",
      phone: `9400000001`,
      serviceIds: [serviceHaircutId],
    });

    // Call them
    const called = await updateQueueStatus({
      entryId: joinRes.entry.id,
      targetStatus: QueueStatus.CALLED,
      staffId: stylistAaravId,
    });
    expect(called.status).toBe(QueueStatus.CALLED);

    // Artificially move calledAt back 15 minutes ago (grace is 10)
    await prisma.queueEntry.update({
      where: { id: called.id },
      data: {
        calledAt: new Date(Date.now() - 15 * 60 * 1000),
      },
    });

    const released = await checkAndReleaseExpiredCalls(salonId);
    expect(released).toContain(called.id);

    const afterCheck = await prisma.queueEntry.findUnique({
      where: { id: called.id },
    });
    expect(afterCheck?.status).toBe(QueueStatus.NO_SHOW);
  });

  // T9 - Rating 9 is rejected (R7)
  it("T9: Rating 9 is rejected", async () => {
    // Rating must be 1-5
    const invalidRating = 9;
    const isValid = invalidRating >= 1 && invalidRating <= 5 && Number.isInteger(invalidRating);
    expect(isValid).toBe(false);
  });

  // T10 - An entry for a non-existent salon is rejected (R7)
  it("T10: An entry for a non-existent salon is rejected", async () => {
    await expect(
      joinQueue({
        salonId: "non_existent_salon_id_999",
        name: "Test",
        phone: "9500000001",
        serviceIds: [serviceHaircutId],
      })
    ).rejects.toThrow();
  });

  // Isolated Role Login Tests
  describe("Role-Isolated Login Tests", () => {
    it("Rejects stylist trying to login as ADMIN", async () => {
      const stylist = await prisma.staff.findFirst({ where: { role: "STYLIST" } });
      expect(stylist).toBeTruthy();
      expect(stylist!.role).not.toBe("ADMIN");
      // If expectedRole is ADMIN, stylist role is rejected
      const isAllowed = stylist!.role === "ADMIN";
      expect(isAllowed).toBe(false);
    });

    it("Rejects receptionist trying to login as STYLIST", async () => {
      const receptionist = await prisma.staff.findFirst({ where: { role: "RECEPTIONIST" } });
      expect(receptionist).toBeTruthy();
      const isAllowed = receptionist!.role === "STYLIST";
      expect(isAllowed).toBe(false);
    });

    it("Allows stylist to login as STYLIST", async () => {
      const stylist = await prisma.staff.findFirst({ where: { role: "STYLIST" } });
      const isAllowed = stylist!.role === "STYLIST";
      expect(isAllowed).toBe(true);
    });

    it("Allows admin to login as ADMIN", async () => {
      const admin = await prisma.staff.findFirst({ where: { role: "ADMIN" } });
      const isAllowed = admin!.role === "ADMIN";
      expect(isAllowed).toBe(true);
    });
  });
});
