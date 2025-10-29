const Category = require('../models/Category');

/**
 * Get all descendant category IDs recursively
 * @param {String|ObjectId} categoryId - The parent category ID
 * @returns {Promise<Array>} Array of all category IDs (including parent)
 */
async function getAllCategoryIds(categoryId) {
  const allCategories = await Category.find({ isActive: true });

  function getDescendants(id) {
    const result = [id];
    const children = allCategories.filter(cat =>
      cat.parent && cat.parent.toString() === id.toString()
    );
    for (const child of children) {
      result.push(...getDescendants(child._id));
    }
    return result;
  }

  return getDescendants(categoryId);
}

/**
 * Build category hierarchy for display
 * @param {String|ObjectId} categoryId - Optional parent category ID
 * @returns {Promise<Array>} Hierarchical category structure
 */
async function getCategoryHierarchy(categoryId = null) {
  const query = categoryId 
    ? { parent: categoryId, isActive: true }
    : { parent: null, isActive: true };
  
  const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });
  
  const result = [];
  for (const category of categories) {
    const children = await getCategoryHierarchy(category._id);
    result.push({
      ...category.toObject(),
      children: children.length > 0 ? children : undefined
    });
  }
  
  return result;
}

module.exports = {
  getAllCategoryIds,
  getCategoryHierarchy
};
