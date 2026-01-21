"use strict";(()=>{var e={};e.id=8853,e.ids=[8853],e.modules={20145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},51309:e=>{e.exports=import("@supabase/supabase-js")},56249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,a){return a in t?t[a]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,a)):"function"==typeof t&&"default"===a?t:void 0}}})},36011:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{config:()=>l,default:()=>p,routeModule:()=>c});var i=a(71802),o=a(47153),n=a(56249),s=a(64686),d=e([s]);s=(d.then?(await d)():d)[0];let p=(0,n.l)(s,"default"),l=(0,n.l)(s,"config"),c=new i.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/expenses/index.active",pathname:"/api/expenses/index.active",bundlePath:"",filename:""},userland:s});r()}catch(e){r(e)}})},60262:(e,t,a)=>{a.d(t,{hx:()=>n,j1:()=>s,sI:()=>o});var r=a(96544);async function i(e){try{let t=`${(0,r.A)()}/api/send-email`,a=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),i=await a.json();if(!a.ok)throw Error(i.error||"Error sending email");return i}catch(e){throw console.error("Email sending failed:",e),e}}async function o(e,t,a,r,o){let n=`
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
            <p><strong>${a}</strong> convidou voc\xea para participar do grupo de despesas <strong>"${t}"</strong> no Divvy.</p>
            
            <a href="${r}" class="button">Aceitar Convite</a>
            
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
  `;return await i({to:e,subject:`${a} convidou voc\xea para ${t} no Divvy`,html:n})}async function n(e,t,a,r,o){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #1f2937;">Nova despesa em ${t} 💸</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Valor:</strong> <span style="font-size: 18px; color: #059669;">R$ ${a}</span></p>
        <p style="margin: 5px 0;"><strong>Descri\xe7\xe3o:</strong> ${r}</p>
        <p style="margin: 5px 0;"><strong>Pago por:</strong> ${o}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Acesse o app para ver os detalhes e seu saldo atualizado.</p>
    </div>
  `;return await i({to:e,subject:`Nova despesa de R$ ${a} em ${t}`,html:n})}async function s(e,t,a,r){let o=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Pagamento Enviado 💰</h2>
      <p><strong>${t}</strong> marcou um pagamento de <strong>R$ ${a}</strong> para voc\xea no grupo <strong>${r}</strong>.</p>
      <p>Por favor, verifique se recebeu o valor e confirme no app.</p>
      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e;">
        Acesse o Divvy para confirmar ou recusar.
      </div>
    </div>
  `;return await i({to:e,subject:`${t} enviou R$ ${a} no Divvy`,html:o})}},96544:(e,t,a)=>{a.d(t,{A:()=>r});let r=()=>{let e=process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_VERCEL_URL||"http://localhost:3000";return(e=e.startsWith("http")?e:`https://${e}`).replace(/\/$/,"")}},76215:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.d(t,{m:()=>n});var i=a(51309),o=e([i]);i=(o.then?(await o)():o)[0];let s="https://jpgifiumxqzbroejhudc.supabase.co",d="sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi";if(!s)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!d)throw Error("Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY");async function n(e){let t=e.headers.get("authorization")?.split(" ")[1];if(!t)throw Error("Unauthorized");let a=(0,i.createClient)(s,d),{data:{user:r},error:o}=await a.auth.getUser(t);if(o||!r)throw Error("Unauthorized");return r}r()}catch(e){r(e)}})},30497:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.d(t,{f:()=>d});var i=a(51309),o=e([i]);i=(o.then?(await o)():o)[0];let n="https://jpgifiumxqzbroejhudc.supabase.co",s=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!n)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!s)throw Error("Missing env SUPABASE_SERVICE_ROLE_KEY");let d=()=>(0,i.createClient)(n,s,{auth:{autoRefreshToken:!1,persistSession:!1}});r()}catch(e){r(e)}})},64686:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{default:()=>d});var i=a(30497),o=a(76215),n=a(60262),s=e([i,o]);async function d(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let{divvyId:a,paidByUserId:r,amount:s,category:d,description:p,date:l,splits:c}=e.body;if(!a||!s||!d||!l||!c||0===c.length)return t.status(400).json({error:"Dados incompletos para criar despesa."});try{let u=await (0,o.m)(e,t),f=(0,i.f)(),{data:g}=await f.from("divvymembers").select("id").eq("divvyid",a).eq("userid",u.id).single();if(!g)return t.status(403).json({error:"Voc\xea n\xe3o \xe9 membro deste grupo."});let{data:m,error:h}=await f.from("expenses").insert({divvyid:a,paidbyuserid:r,amount:s,category:d,description:p,date:l,locked:!1}).select().single();if(h)throw h;let x=c.map(e=>({expenseid:m.id,participantuserid:e.participantuserid,amountowed:e.amountowed})),{error:v}=await f.from("expensesplits").insert(x);if(v)throw await f.from("expenses").delete().eq("id",m.id),v;let{data:y}=await f.from("divvies").select("name").eq("id",a).single(),{data:b}=await f.from("userprofiles").select("displayname, fullname").eq("id",r).single(),w=b?.displayname||b?.fullname||"Algu\xe9m",E=x.map(e=>e.participantuserid).filter(e=>e!==r),P=E.map(e=>({user_id:e,divvy_id:a,type:"expense",title:"Nova Despesa",message:`${w} adicionou: ${p} (R$ ${s.toFixed(2)})`,created_at:new Date().toISOString(),is_read:!1}));P.length>0&&await f.from("notifications").insert(P);let{data:_}=await f.from("userprofiles").select("email").in("id",E);if(_)for(let e of _)e.email&&await (0,n.hx)(e.email,y?.name||"Grupo",s.toFixed(2),p,w);return t.status(201).json({expense:m})}catch(e){if("Unauthorized"===e.message)return t.status(401).json({error:"N\xe3o autorizado"});return console.error("Create Expense Error:",e),t.status(500).json({error:e.message})}}[i,o]=s.then?(await s)():s,r()}catch(e){r(e)}})},47153:(e,t)=>{var a;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return a}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(a||(a={}))},71802:(e,t,a)=>{e.exports=a(20145)}};var t=require("../../../webpack-api-runtime.js");t.C(e);var a=t(t.s=36011);module.exports=a})();