import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

const baseOrigin = 'http://localhost:3000';

function parseEnv() {
  const txt = fs.readFileSync(path.resolve(process.cwd(), 'server', '.env'), 'utf8');
  const obj = {};
  txt.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2];
      if ((v.startsWith("\'") && v.endsWith("\'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1,-1);
      obj[m[1]] = v;
    }
  });
  return obj;
}

function request(url, method='GET', headers={}, body=null) {
  return new Promise((resolve,reject)=>{
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol==='https:'?443:80),
      path: u.pathname + u.search,
      method,
      headers
    };
    const req = lib.request(opts, res=>{
      let data='';
      res.on('data',chunk=>data+=chunk);
      res.on('end',()=>{
        try{
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        }catch(e){ resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error',reject);
    if (body) req.write(body);
    req.end();
  });
}

(async()=>{
  try{
    const env = parseEnv();
    console.log('Logging in...');
    const login = await request(baseOrigin + '/api/user/login','POST',{'Content-Type':'application/json'},JSON.stringify({email:'smoketest@example.com',password:'password123'}));
    console.log('login status',login.status);
    const token = login.body.token;

    console.log('Creating purchase (server will create Stripe session)');
    const purchase = await request(baseOrigin + '/api/credits/purchase','POST',{'Content-Type':'application/json','authorization':'Bearer '+token,'origin':'http://localhost:5174'},JSON.stringify({planId:'basic'}));
    console.log('purchase',purchase.status,purchase.body);
    const sessionId = purchase.body.sessionId;
    if(!sessionId) throw new Error('No sessionId returned');

    console.log('Calling complete endpoint to finalize purchase');
    const complete = await request(baseOrigin + `/api/credits/complete?session_id=${sessionId}`,'GET',{'authorization':'Bearer '+token});
    console.log('complete',complete.status,complete.body);

    console.log('Fetching user after completion');
    const user = await request(baseOrigin + '/api/user/data','GET',{'authorization':'Bearer '+token});
    console.log('user',user.status,user.body);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();
})();
