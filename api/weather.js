export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const locations = [
      { day: 1, date: "2026-07-11", lat: 38.62, lng: -90.19, name: "St. Louis, MO" },
      { day: 2, date: "2026-07-12", lat: 38.93, lng: -99.56, name: "Ellis, KS" },
      { day: 3, date: "2026-07-13", lat: 40.34, lng: -105.68, name: "Estes Park, CO" },
      { day: 4, date: "2026-07-14", lat: 40.34, lng: -105.68, name: "Rocky Mountain NP" },
      { day: 5, date: "2026-07-15", lat: 37.00, lng: -110.17, name: "Monument Valley, UT" },
      { day: 6, date: "2026-07-16", lat: 37.63, lng: -112.17, name: "Bryce Canyon, UT" },
      { day: 7, date: "2026-07-17", lat: 37.30, lng: -113.02, name: "Zion NP, UT" },
      { day: 8, date: "2026-07-18", lat: 36.49, lng: -118.57, name: "Sequoia NP, CA" },
      { day: 9, date: "2026-07-19", lat: 37.75, lng: -119.59, name: "Yosemite NP, CA" },
      { day: 10, date: "2026-07-20", lat: 37.75, lng: -119.59, name: "Yosemite NP, CA" },
      { day: 11, date: "2026-07-21", lat: 34.90, lng: -117.02, name: "Barstow, CA" },
      { day: 12, date: "2026-07-22", lat: 36.06, lng: -112.14, name: "Grand Canyon, AZ" },
      { day: 13, date: "2026-07-23", lat: 36.06, lng: -112.14, name: "Grand Canyon, AZ" },
      { day: 14, date: "2026-07-24", lat: 34.82, lng: -109.89, name: "Petrified Forest, AZ" },
      { day: 15, date: "2026-07-25", lat: 35.22, lng: -101.83, name: "Amarillo, TX" },
      { day: 16, date: "2026-07-26", lat: 35.96, lng: -83.92, name: "Knoxville, TN" }
    ];

    const uniqueCoords = [];
    const seen = new Set();
    for (const loc of locations) {
      const key = `${loc.lat},${loc.lng}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCoords.push({ lat: loc.lat, lng: loc.lng });
      }
    }

    const forecasts = await Promise.all(uniqueCoords.map(async (coord) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&temperature_unit=fahrenheit&forecast_days=16&timezone=auto`;
      const resp = await fetch(url);
      if (!resp.ok) return { coord, data: null };
      const data = await resp.json();
      return { coord, data };
    }));

    const forecastMap = {};
    for (const f of forecasts) {
      if (f.data && f.data.daily) {
        forecastMap[`${f.coord.lat},${f.coord.lng}`] = f.data.daily;
      }
    }

    const results = locations.map(loc => {
      const daily = forecastMap[`${loc.lat},${loc.lng}`];
      if (!daily) return { day: loc.day, error: true };

      const dateIdx = daily.time.indexOf(loc.date);
      if (dateIdx === -1) return { day: loc.day, error: true };

      return {
        day: loc.day,
        name: loc.name,
        date: loc.date,
        high: Math.round(daily.temperature_2m_max[dateIdx]),
        low: Math.round(daily.temperature_2m_min[dateIdx]),
        precip: daily.precipitation_probability_max[dateIdx],
        code: daily.weathercode[dateIdx]
      };
    });

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
    return res.status(200).json(results);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
