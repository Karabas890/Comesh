/** Text-first input boundary. A future speech provider must transcribe to text
 * before the same validation and completion transaction; audio is not stored. */
export interface AnswerInputProvider {
  kind: "text" | "voice";
  toText(input: string | Blob): Promise<string>;
}
export const textInput: AnswerInputProvider = {
  kind: "text",
  async toText(input) {
    if (typeof input !== "string") throw new Error("Text input required");
    return input.trim();
  },
};
