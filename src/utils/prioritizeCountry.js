/**
 * Helper function to prioritize a country in a list
 * Moves the specified country to the first position while keeping others in their original order
 * 
 * @param {Array} list - Array of country objects with a 'country' property
 * @param {string} countryName - Name of the country to prioritize
 * @returns {Array} - Reordered array with prioritized country first
 */
export const prioritizeCountry = (list, countryName) => {
  if (!Array.isArray(list) || !countryName) {
    return list;
  }

  // Find the index of the country to prioritize
  const countryIndex = list.findIndex(
    item => item.country && item.country.toLowerCase() === countryName.toLowerCase()
  );

  // If country not found, return original list
  if (countryIndex === -1) {
    return list;
  }

  // If already first, return as-is
  if (countryIndex === 0) {
    return list;
  }

  // Create new array with prioritized country first
  const prioritizedCountry = list[countryIndex];
  const restOfList = [
    ...list.slice(0, countryIndex),
    ...list.slice(countryIndex + 1)
  ];

  return [prioritizedCountry, ...restOfList];
};
