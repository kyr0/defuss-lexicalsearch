function letterCode(previous, char, next, first) {
  switch (char) {
    case "a":
    case "e":
    case "i":
    case "j":
    case "o":
    case "u":
    case "y":
    case "\xE4":
    case "\xF6":
    case "\xFC":
      return "0";
    case "b":
      return "1";
    case "p":
      return next === "h" ? "3" : "1";
    case "d":
    case "t":
      return /[csz]/.test(next) ? "8" : "2";
    case "f":
    case "v":
    case "w":
      return "3";
    case "g":
    case "k":
    case "q":
      return "4";
    case "c":
      if (first) return /[ahkloqrux]/.test(next) ? "4" : "8";
      return /[sz]/.test(previous) || !/[ahkoqux]/.test(next) ? "8" : "4";
    case "x":
      return /[ckq]/.test(previous) ? "8" : "48";
    case "l":
      return "5";
    case "m":
    case "n":
      return "6";
    case "r":
      return "7";
    case "s":
    case "z":
      return "8";
    default:
      return "";
  }
}
function koelnerPhonetik(word) {
  const letters = Array.from(
    word.toLowerCase().normalize("NFC"),
    (char) => "\xE4\xF6\xFC".includes(char) ? char : char === "\xDF" ? "s" : char.normalize("NFD").replace(new RegExp("\\p{M}", "gu"), "")
  ).join("").replace(/[^a-zäöü]/g, "");
  let codes = "";
  for (let i = 0; i < letters.length; i++) {
    codes += letterCode(letters[i - 1] ?? "", letters[i], letters[i + 1] ?? "", i === 0);
  }
  const collapsed = codes.replace(/(.)\1+/g, "$1");
  return collapsed.slice(0, 1) + collapsed.slice(1).replace(/0/g, "");
}

export { koelnerPhonetik as k };
