"use strict";(()=>{var e={};e.id=5973,e.ids=[5973],e.modules={20145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},1121:e=>{e.exports=require("qrcode")},51309:e=>{e.exports=import("@supabase/supabase-js")},46555:e=>{e.exports=import("uuid")},56249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,r){return r in t?t[r]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,r)):"function"==typeof t&&"default"===r?t:void 0}}})},85910:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.r(t),r.d(t,{config:()=>l,default:()=>p,routeModule:()=>c});var i=r(71802),o=r(47153),n=r(56249),s=r(28086),d=e([s]);s=(d.then?(await d)():d)[0];let p=(0,n.l)(s,"default"),l=(0,n.l)(s,"config"),c=new i.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/invite/send.active",pathname:"/api/invite/send.active",bundlePath:"",filename:""},userland:s});a()}catch(e){a(e)}})},60262:(e,t,r)=>{r.d(t,{hx:()=>n,j1:()=>s,sI:()=>o});var a=r(96544);async function i(e){try{let t=`${(0,a.A)()}/api/send-email`,r=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),i=await r.json();if(!r.ok)throw Error(i.error||"Error sending email");return i}catch(e){throw console.error("Email sending failed:",e),e}}async function o(e,t,r,a,o){let n=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #7c3aed; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .content { padding: 40px 30px; text-align: center; }
          .content p { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
          .button { display: inline-block; padding: 14px 28px; background: #7c3aed; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.2s; }
          .button:hover { background: #6d28d9; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          .qr-container { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 12px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Voc\xea foi convidado! 🎉</h1>
          </div>
          <div class="content">
            <p>Ol\xe1!</p>
            <p><strong>${r}</strong> convidou voc\xea para participar do grupo de despesas <strong>"${t}"</strong> no Divvy.</p>
            
            <a href="${a}" class="button">Aceitar Convite</a>
            
            ${o?`
              <div style="margin-top: 30px;">
                <p style="font-size: 14px; margin-bottom: 10px;">Ou escaneie com seu celular:</p>
                <div class="qr-container">
                  <img src="${o}" width="150" height="150" alt="QR Code" style="display: block;" />
                </div>
              </div>
            `:""}
            
            <p style="font-size: 12px; margin-top: 30px;">Este link expira em 7 dias.</p>
          </div>
          <div class="footer">
            <p>\xa9 2026 Divvy. Gest\xe3o inteligente de despesas.</p>
          </div>
        </div>
      </body>
    </html>
  `;return await i({to:e,subject:`${r} convidou voc\xea para ${t} no Divvy`,html:n})}async function n(e,t,r,a,o){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #1f2937;">Nova despesa em ${t} 💸</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Valor:</strong> <span style="font-size: 18px; color: #059669;">R$ ${r}</span></p>
        <p style="margin: 5px 0;"><strong>Descri\xe7\xe3o:</strong> ${a}</p>
        <p style="margin: 5px 0;"><strong>Pago por:</strong> ${o}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Acesse o app para ver os detalhes e seu saldo atualizado.</p>
    </div>
  `;return await i({to:e,subject:`Nova despesa de R$ ${r} em ${t}`,html:n})}async function s(e,t,r,a){let o=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Pagamento Enviado 💰</h2>
      <p><strong>${t}</strong> marcou um pagamento de <strong>R$ ${r}</strong> para voc\xea no grupo <strong>${a}</strong>.</p>
      <p>Por favor, verifique se recebeu o valor e confirme no app.</p>
      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e;">
        Acesse o Divvy para confirmar ou recusar.
      </div>
    </div>
  `;return await i({to:e,subject:`${t} enviou R$ ${r} no Divvy`,html:o})}},96544:(e,t,r)=>{r.d(t,{A:()=>a});let a=()=>{let e=process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_VERCEL_URL||"http://localhost:3000";return(e=e.startsWith("http")?e:`https://${e}`).replace(/\/$/,"")}},76215:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{m:()=>n});var i=r(51309),o=e([i]);i=(o.then?(await o)():o)[0];let s="https://jpgifiumxqzbroejhudc.supabase.co",d="sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi";if(!s)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!d)throw Error("Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY");async function n(e){let t=e.headers.get("authorization")?.split(" ")[1];if(!t)throw Error("Unauthorized");let r=(0,i.createClient)(s,d),{data:{user:a},error:o}=await r.auth.getUser(t);if(o||!a)throw Error("Unauthorized");return a}a()}catch(e){a(e)}})},30497:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.d(t,{f:()=>d});var i=r(51309),o=e([i]);i=(o.then?(await o)():o)[0];let n="https://jpgifiumxqzbroejhudc.supabase.co",s=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!n)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!s)throw Error("Missing env SUPABASE_SERVICE_ROLE_KEY");let d=()=>(0,i.createClient)(n,s,{auth:{autoRefreshToken:!1,persistSession:!1}});a()}catch(e){a(e)}})},28086:(e,t,r)=>{r.a(e,async(e,a)=>{try{r.r(t),r.d(t,{default:()=>u});var i=r(30497),o=r(60262),n=r(46555),s=r(1121),d=r.n(s),p=r(96544),l=r(76215),c=e([i,n,l]);async function u(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let r=e.headers.authorization;if(!r?.startsWith("Bearer "))return t.status(401).json({error:"Unauthorized"});let a=(0,i.f)(),{divvyId:s,email:c}=e.body;if(!s||!c)return t.status(400).json({error:"Missing required fields"});try{let r=await (0,l.m)(e,t),{data:i,error:u}=await a.from("divvymembers").select("id").eq("divvyid",s).eq("userid",r.id).single();if(u||!i)return t.status(403).json({error:"Voc\xea n\xe3o tem permiss\xe3o para convidar para este grupo."});let{data:f}=await a.from("divvyinvites").select("*").eq("divvyid",s).eq("invitedemail",c.toLowerCase()).eq("status","pending").single();if(f)return t.status(400).json({error:"J\xe1 existe um convite pendente para este email."});let g=(0,n.v4)(),v=new Date(Date.now()+6048e5).toISOString(),{error:h}=await a.from("divvyinvites").insert({id:g,divvyid:s,invitedemail:c.toLowerCase(),invitedbyuserid:r.id,status:"pending",expiresat:v});if(h)throw h;let{data:m}=await a.from("divvies").select("name").eq("id",s).single(),{data:x}=await a.from("userprofiles").select("fullname, displayname").eq("id",r.id).single(),y=x?.displayname||x?.fullname||"Um amigo",b=m?.name||"Grupo de Despesas",w=(0,p.A)(),E=`${w}/join/${g}`,P=await d().toDataURL(E);return await (0,o.sI)(c,b,y,E,P),t.status(200).json({success:!0,inviteLink:E})}catch(e){if(e?.message==="Unauthorized")return t.status(401).json({error:"Unauthorized"});return console.error("Invite Error:",e),t.status(500).json({error:e.message})}}[i,n,l]=c.then?(await c)():c,a()}catch(e){a(e)}})},47153:(e,t)=>{var r;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return r}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(r||(r={}))},71802:(e,t,r)=>{e.exports=r(20145)}};var t=require("../../../webpack-api-runtime.js");t.C(e);var r=t(t.s=85910);module.exports=r})();