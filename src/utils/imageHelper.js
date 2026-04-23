/**
 * 获取图片URL
 * @param {string} path - 图片相对路径，如 'images/倒立走mzk.png'
 * @returns {string} 完整的图片URL
 */
export const getImageUrl = (path) => {
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || '/assets'
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

export default getImageUrl
