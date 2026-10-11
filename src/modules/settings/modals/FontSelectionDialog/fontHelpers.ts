export function filterFonts(fonts: string[], query: string) {
	const search = query.toLowerCase();
	return fonts.filter((font) => font.toLowerCase().includes(search));
}
export function getImportedFontName(fileName: string) {
	return fileName.split(".")[0].replace(/[^a-zA-Z0-9]/g, "");
}
