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

export const updateScooterCity = async (scooter, databases) => {
  if (scooter.city === null || scooter.city === "") {
    try {
      const city = await reverseGeocode(scooter.latitude, scooter.longitude);
      if (city) {
        scooter.city = city;
        return databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_SCOOTER_COLLECTION_ID,
          scooter.$id,
          {
            city: city,
          }
        );
      }
    } catch (err) {
      console.log("Error updating scooter city:", err);
    }
  }
  return Promise.resolve();
};
