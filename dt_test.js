
async function test() {
  const url = "https://diffuseur.datatourisme.fr/webservice/bb96b7a3df0ed93dd8e821e0a9a34aa1/b059e194-5304-4bb5-b23e-e30fecedab7c";
  console.log("Fetching", url);
  const res = await fetch(url);
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  
  if (res.headers.get("content-type").includes("application/zip")) {
      console.log("It's a ZIP archive!");
  } else {
      const text = await res.text();
      console.log("Length:", text.length);
      console.log("Preview:", text.substring(0, 200));
  }
}
test();
