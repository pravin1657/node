import axios from "axios";

async function callApi(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (err) {
    return { error: err.message };
  }
}

// n8n will pass the URL as an argument
const url = process.argv[2]; 

if (!url) {
  console.error("Please provide a URL");
  process.exit(1);
}

callApi(url).then((data) => {
  console.log(JSON.stringify(data)); // print output for n8n
});
