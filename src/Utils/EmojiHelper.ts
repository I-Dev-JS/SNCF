export class EmojiHelper {
  public static readonly DIGITS = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

  public static numberToEmojiString(nbr: number): string {
    return nbr
      .toString()
      .split("")
      .map((c) => `${EmojiHelper.DIGITS[Number(c)]}`)
      .join("");
  }
}
