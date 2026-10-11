const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const getNoteFromFreq = (freq: number) => {
	if (freq <= 20) return ""; // Human hearing floor
	const n = Math.round(69 + 12 * Math.log2(freq / 440));
	const octave = Math.floor(n / 12) - 1;
	const noteName = NOTES[((n % 12) + 12) % 12];
	return `${noteName}${octave}`;
};
