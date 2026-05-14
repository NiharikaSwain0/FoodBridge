import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../services/firebase';

export const seedInitialData = async () => {
  try {
    // Check if data already exists to avoid duplicates
    const q = query(collection(db, 'heatmapData'), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      console.log("Data already seeded");
      return { success: true, message: "Data already exists" };
    }

    // 1. Seed Heatmap Data
    const heatmapPoints = [
      { location: { latitude: 19.0760, longitude: 72.8777 }, hungerScore: 0.98, area: "Mumbai Central" },
      { location: { latitude: 28.6139, longitude: 77.2090 }, hungerScore: 0.88, area: "New Delhi" },
      { location: { latitude: 12.9716, longitude: 77.5946 }, hungerScore: 0.32, area: "Bangalore" },
      { location: { latitude: 13.0827, longitude: 80.2707 }, hungerScore: 0.92, area: "Chennai" },
      { location: { latitude: 22.5726, longitude: 88.3639 }, hungerScore: 0.68, area: "Kolkata" },
      { location: { latitude: 17.3850, longitude: 78.4867 }, hungerScore: 0.78, area: "Hyderabad" },
      { location: { latitude: 23.0225, longitude: 72.5714 }, hungerScore: 0.42, area: "Ahmedabad" },
      { location: { latitude: 26.8467, longitude: 80.9462 }, hungerScore: 0.82, area: "Lucknow" },
    ];

    for (const point of heatmapPoints) {
      await addDoc(collection(db, 'heatmapData'), {
        ...point,
        createdAt: serverTimestamp()
      });
    }

    // 2. Seed some mock donations
    const mockDonations = [
      {
        foodName: "Fresh Meals (20 packs)",
        quantity: "20 units",
        category: "Cooked Food",
        expiryTime: new Date(Date.now() + 86400000).toISOString(),
        description: "Freshly cooked vegetable biryani from lunch service.",
        location: { latitude: 19.0760, longitude: 72.8777 },
        status: "available",
        createdAt: serverTimestamp()
      },
      {
        foodName: "Bakery Surplus",
        quantity: "5 kg",
        category: "Bakery",
        expiryTime: new Date(Date.now() + 172800000).toISOString(),
        description: "Assorted bread and pastries.",
        location: { latitude: 28.6139, longitude: 77.2090 },
        status: "available",
        createdAt: serverTimestamp()
      }
    ];

    for (const donation of mockDonations) {
      await addDoc(collection(db, 'donations'), donation);
    }

    return { success: true, message: "Data seeded successfully" };
  } catch (error) {
    console.error("Error seeding data:", error);
    return { success: false, error: error.message };
  }
};
