module.exports = async ({ axios }) => {
  // TODO make sitemap route configurable
  // TODO validate sitemap nodes
  // TODO prep 'path' and 'type' props for each sitemap node
  const { data: sitemap } = await axios.get("/sitemap")
  return sitemap
}