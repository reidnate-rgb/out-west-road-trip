export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const locations = [
      { day: 1, lat: 38.62, lng: -90.19, name: "St. Louis, MO" },
      { day: 2, lat: 38.93, lng: -99.56, name: "Ellis, KS" },
      { day: 3, lat: 40.34, lng: -105.68, name: "Estes Park, CO" },
      { day: 4, lat: 40.34, lng: -105.68, name: "Rocky Mountain NP" },
      { day: 5, lat: 37.00, lng: -110.17, name: "Monument Valley, UT" },
      { day: 6, lat: 37.63, lng: -112.17, name: "Bryce Canyon, UT" },
      { day: 7, lat: 37.30, lng: -113.02, name: "Zion NP, UT" },
      { day: 8, lat: 36.49, lng: -118.57, name: "Sequoia NP, CA" },
      { day: 9, lat: 37.75, lng: -119.59, name: "Yosemite NP, CA" },
      { day: 10, lat: 37.75, lng: -119.59, name: "Yosemite NP, CA" },
      { day: 11, lat: 34.90, lng: -117.02, name: "Barstow, CA" },
      { day: 12, lat: 36.06, lng: -112.14, name: "Grand Canyon, AZ" },
      { day: 13, lat: 36.06, lng: -112.14, name: "Grand Canyon, AZ" },
      { day: 14, lat: 34.82, lng: -109.89, name: "Petrified Forest, AZ" },
      { day: 15, lat: 35.22, lng: -101.83, name: "Amarillo, TX" },
      { day: 16, lat: 35.96, lng: -83.92, name: "Knoxville, TN" }
    ];

    const startDate = '2026-07-11';
    const endDate = '2026-07-26';

    const results = await Promise.all(locations.map(async (loc) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&temperature_unit=fahrenheit&start_date=${startDate}&end_date=${endDate}&timezone=auto`;
      const resp = await fetch(url);
      if (!resp.ok) return { day: loc.day, error: true };
      const data = await resp.json();

      const dayIndex = loc.day - 1;
      if (!data.daily || dayIndex >= data.daily.time.length) {
        return { day: loc.day, error: true };
      }

      return {
        day: loc.day,
        name: loc.name,
        date: data.daily.time[dayIndex],
        high: Math.round(data.daily.temperature_2m_max[dayIndex]),
        low: Math.round(data.daily.temperature_2m_min[dayIndex]),
        precip: data.daily.precipitation_probability_max[dayIndex],
        code: data.daily.weathercode[dayIndex]
      };
    }));

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
    return res.status(200).json(results);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
