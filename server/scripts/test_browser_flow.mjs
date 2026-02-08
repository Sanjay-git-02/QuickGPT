import fs from "fs";
import path from "path";
import http from "http";
import https from "https";

const baseOrigin = "http://localhost:3000";

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

    // Ensure smoketest exists -> login
    console.log("Login smoketest user");
    let login = await request(
      baseOrigin + "/api/user/login",
      "POST",
      { "Content-Type": "application/json" },
      JSON.stringify({
        email: "smoketest@example.com",
        password: "password123",
      }),
    );
    if (login.status !== 200)
      throw new Error("smoketest login failed: " + JSON.stringify(login.body));
    const tokenA = login.body.token;

    // Create or login second user
    const otherEmail = "otheruser@example.com";
    console.log("Ensure other user exists (register or login):", otherEmail);
    let loginB = await request(
      baseOrigin + "/api/user/login",
      "POST",
      { "Content-Type": "application/json" },
      JSON.stringify({ email: otherEmail, password: "password123" }),
    );
    let tokenB;
    if (loginB.status === 200) {
      tokenB = loginB.body.token;
    } else {
      const reg = await request(
        baseOrigin + "/api/user/register",
        "POST",
        { "Content-Type": "application/json" },
        JSON.stringify({
          name: "Other",
          email: otherEmail,
          password: "password123",
        }),
      );
      if (reg.status !== 200)
        throw new Error("register other failed: " + JSON.stringify(reg.body));
      tokenB = reg.body.token;
    }

    // Fetch both users before
    const aBefore = await request(baseOrigin + "/api/user/data", "GET", {
      authorization: "Bearer " + tokenA,
    });
    const bBefore = await request(baseOrigin + "/api/user/data", "GET", {
      authorization: "Bearer " + tokenB,
    });
    console.log(
      "Before credits: smoketest=",
      aBefore.body.user.credits,
      "other=",
      bBefore.body.user.credits,
    );

    // Create purchase for smoketest
    const purchase = await request(
      baseOrigin + "/api/credits/purchase",
      "POST",
      {
        "Content-Type": "application/json",
        authorization: "Bearer " + tokenA,
        origin: "http://localhost:5174",
      },
      JSON.stringify({ planId: "basic" }),
    );
    if (!purchase.body.sessionId) throw new Error("no sessionId");
    const sessionId = purchase.body.sessionId;
    console.log("Created session", sessionId);

    // Call complete endpoint (simulate redirect)
    const complete = await request(
      baseOrigin + `/api/credits/complete?session_id=${sessionId}`,
      "GET",
      { authorization: "Bearer " + tokenA },
    );
    console.log("complete response", complete.status, complete.body);

    // Fetch both users after
    const aAfter = await request(baseOrigin + "/api/user/data", "GET", {
      authorization: "Bearer " + tokenA,
    });
    const bAfter = await request(baseOrigin + "/api/user/data", "GET", {
      authorization: "Bearer " + tokenB,
    });
    console.log(
      "After credits: smoketest=",
      aAfter.body.user.credits,
      "other=",
      bAfter.body.user.credits,
    );

    const deltaA = aAfter.body.user.credits - aBefore.body.user.credits;
    const deltaB = bAfter.body.user.credits - bBefore.body.user.credits;
    console.log(
      "Credit changes: smoketest delta=",
      deltaA,
      "other delta=",
      deltaB,
    );

    if (deltaA > 0 && deltaB === 0) {
      console.log("SUCCESS: only target user credited");
      process.exit(0);
    } else {
      console.error("FAIL: unexpected credit changes");
      process.exit(2);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
