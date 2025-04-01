import axios from "axios";

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${process.env.GEOAPIFY_API_KEY}`
    );
    return response.data.results[0].city;
  } catch (error) {
    console.log(error);
    return null;
  }
};
