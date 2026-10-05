const bcrypt = require("bcryptjs");
// Le mot de passe est lu sur l'entrée standard, pas dans les arguments du processus.
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", data => { input += data; });
process.stdin.on("end", async () => {
  const password = input.replace(/\r?\n$/, "");
  if (!password || Buffer.byteLength(password) > 72) {
    console.error("Mot de passe requis : 72 octets maximum."); process.exitCode = 1; return;
  }
  console.log(await bcrypt.hash(password, 12));
});
