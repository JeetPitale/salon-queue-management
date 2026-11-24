const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create or update Salon
  let salon = await prisma.salon.findFirst();
  if (!salon) {
    salon = await prisma.salon.create({
      data: {
        name: "Velvet & Blade Salon",
        address: "102 MG Road, Bandra West, Mumbai",
        phone: "+91 98765 43210",
        openingTime: "09:00",
        closingTime: "21:00",
        gracePeriodMinutes: 10,
        isOpen: true,
      },
    });
  }

  // 2. Services
  const servicesData = [
    { name: "Haircut", durationMinutes: 30, price: 350 },
    { name: "Beard Trim", durationMinutes: 15, price: 150 },
    { name: "Hair Spa", durationMinutes: 45, price: 800 },
    { name: "Facial & Cleanse", durationMinutes: 40, price: 650 },
    { name: "Hair Coloring", durationMinutes: 60, price: 1200 },
  ];

  const serviceMap = new Map();
  for (const s of servicesData) {
    let service = await prisma.service.findFirst({
      where: { salonId: salon.id, name: s.name },
    });
    if (!service) {
      service = await prisma.service.create({
        data: {
          salonId: salon.id,
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
          isActive: true,
        },
      });
    }
    serviceMap.set(s.name, service.id);
  }

  // 3. Staff
  const staffData = [
    {
      name: "Admin Manager",
      username: "admin",
      password: "password123",
      role: "ADMIN",
      status: "AVAILABLE",
    },
    {
      name: "Frontdesk Rita",
      username: "receptionist",
      password: "password123",
      role: "RECEPTIONIST",
      status: "AVAILABLE",
    },
    {
      name: "Aarav Sharma",
      username: "aarav",
      password: "password123",
      role: "STYLIST",
      status: "AVAILABLE",
      skills: ["Haircut", "Beard Trim", "Hair Spa"],
    },
    {
      name: "Priya Patel",
      username: "priya",
      password: "password123",
      role: "STYLIST",
      status: "AVAILABLE",
      skills: ["Haircut", "Hair Spa", "Facial & Cleanse", "Hair Coloring"],
    },
    {
      name: "Kabir Khan",
      username: "kabir",
      password: "password123",
      role: "STYLIST",
      status: "AVAILABLE",
      skills: ["Haircut", "Beard Trim", "Facial & Cleanse"],
    },
  ];

  for (const st of staffData) {
    let staff = await prisma.staff.findUnique({
      where: { username: st.username },
    });
    if (!staff) {
      staff = await prisma.staff.create({
        data: {
          salonId: salon.id,
          name: st.name,
          username: st.username,
          password: st.password,
          role: st.role,
          status: st.status,
        },
      });
    }

    if (st.skills) {
      for (const skillName of st.skills) {
        const sId = serviceMap.get(skillName);
        if (sId) {
          await prisma.staffSkill.upsert({
            where: {
              staffId_serviceId: {
                staffId: staff.id,
                serviceId: sId,
              },
            },
            update: {},
            create: {
              staffId: staff.id,
              serviceId: sId,
            },
          });
        }
      }
    }
  }

  console.log("Seeding complete! Salon ID:", salon.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
