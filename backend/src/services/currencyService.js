const axios = require('axios');

const convertToEuro = async (amount, fromCurrency) => {
  if (fromCurrency === 'EUR') return amount;
  
  try {
    // Utilisation de l'API ExchangeRate (Remplace par ta clé en .env)
    const url = `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/pair/${fromCurrency}/EUR/${amount}`;
    const response = await axios.get(url);
    return response.data.conversion_result;
  } catch (error) {
    console.error("Erreur conversion devise:", error.message);
    return amount; // Fallback : on garde le montant original
  }
};

module.exports = { convertToEuro };