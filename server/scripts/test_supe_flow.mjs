import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import mongoose from "mongoose";

const baseOrigin = "http://localhost:3000";
const TEST_EMAIL = "supe@gmail.com";
const TEST_PASS = "1234";

function parseEnv() {
  const txt = fs.readFileSync(
    path.resolve(process.cwd(), "server", ".env"),
    "utf8",
  );
  const obj = {};
  txt.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2];
      if (
        (v.startsWith("'") && v.endsWith("'")) ||
        (v.startsWith('"') && v.endsWith('"'))
      )
        v = v.slice(1, -1);
      obj[m[1]] = v;
    }
  });
  return obj;
}

function request(url, method = "GET", headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + u.search,
      method,
      headers,
    };
    const req = lib.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const env = parseEnv();
    if (!env.DB_URL) throw new Error("Missing DB_URL in server/.env");

    await mongoose.connect(`${env.DB_URL}/quickgpt`);
    const User = (await import("../models/user.js")).default;

    const beforeUsers = await User.find({}).lean();
    const beforeMap = new Map(beforeUsers.map((u) => [u.email, u.credits]));
    console.log("Users count before:", beforeUsers.length);

    console.log("Attempt login for", TEST_EMAIL);
    let login = await request(
      baseOrigin + "/api/user/login",
      "POST",
      { "Content-Type": "application/json" },
      JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
    );
    let token;
    if (login.status === 200) {
      token = login.body.token;
    } else {
      console.log("Registering user", TEST_EMAIL);
      const reg = await request(
        baseOrigin + "/api/user/register",
        "POST",
        { "Content-Type": "application/json" },
        JSON.stringify({
          name: "Supe",
          email: TEST_EMAIL,
          password: TEST_PASS,
        }),
      );
      if (reg.status !== 200)
        throw new Error("register failed: " + JSON.stringify(reg.body));
      token = reg.body.token;
    }

    const aBefore = await User.findOne({ email: TEST_EMAIL }).lean();
    const beforeCredits = aBefore ? aBefore.credits : null;
    console.log("Before credits for", TEST_EMAIL, beforeCredits);

    const purchase = await request(
      baseOrigin + "/api/credits/purchase",
      "POST",
      {
        "Content-Type": "application/json",
        authorization: "Bearer " + token,
        origin: "http://localhost:5174",
      },
      JSON.stringify({ planId: "basic" }),
    );
    if (!purchase.body.sessionId) throw new Error("no sessionId from purchase");
    const sessionId = purchase.body.sessionId;
    console.log("Session created", sessionId);

    const complete = await request(
      baseOrigin + `/api/credits/complete?session_id=${sessionId}`,
      "GET",
      { authorization: "Bearer " + token },
    );
    console.log("complete status", complete.status, complete.body);

    const afterUsers = await User.find({}).lean();
    const changed = [];
    for (const u of afterUsers) {
      const before = beforeMap.get(u.email) ?? null;
      const after = u.credits;
      if (before === null) continue;
      if (after !== before)
        changed.push({ email: u.email, before, after, delta: after - before });
    }

    console.log("Changed users:", changed);
    const smoke = changed.find((c) => c.email === TEST_EMAIL);
    const others = changed.filter((c) => c.email !== TEST_EMAIL);
    if (!smoke) {
      console.error("Target user not changed");
      process.exit(2);
    }
    if (others.length > 0) {
      console.error("Other users changed:", others);
      process.exit(3);
    }
    console.log("SUCCESS: only target user credited", smoke);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
