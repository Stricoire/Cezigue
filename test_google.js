import fetch from "node-fetch";

async function run() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Missing API KEY");

  const originLat = 43.774;
  const originLng = 1.684;
  const dest = encodeURIComponent("18 Rue Jean d'Alembert 31100 Toulouse");
  
  // Need a timestamp for next Monday 8:00 AM to avoid 'train not running right now' issues.
  // Or just 8:00 AM today.
  const d = new Date();
  d.setHours(8,0,0,0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  const timeParam = `&departure_time=${Math.floor(d.getTime()/1000)}`;

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${dest}&mode=transit${timeParam}&language=fr&key=${apiKey}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.status !== "OK") {
    console.log("STATUS:", data.status, data.error_message);
    return;
  }
  
  const steps = data.routes[0].legs[0].steps;
  console.log("TOTAL DURATION:", Math.round(data.routes[0].legs[0].duration.value / 60), "minutes");
  steps.forEach((s, idx) => {
    console.log(`[Step ${idx}]`, s.travel_mode, "-", s.duration.text, "-", s.html_instructions?.replace(/<[^>]+>/g, ""));
    if (s.travel_mode === "TRANSIT") {
       console.log("   Line:", s.transit_details?.line?.short_name, "Vehicle:", s.transit_details?.line?.vehicle?.type);
    }
  });
}

run().catch(console.error);
